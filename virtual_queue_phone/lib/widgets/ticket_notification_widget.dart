import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';
import 'package:go_router/go_router.dart';
import 'package:virtual_queue_core/virtual_queue_core.dart';

import '../services/place_location.dart';
import '../theme/turnix_theme.dart';

/// Card persistente del turno activo: encabezado, mapa y acciones.
class TicketNotificationWidget extends ConsumerStatefulWidget {
  const TicketNotificationWidget({
    super.key,
    required this.ticket,
    required this.onCancel,
  });

  final Ticket ticket;
  final VoidCallback onCancel;

  @override
  ConsumerState<TicketNotificationWidget> createState() =>
      _TicketNotificationWidgetState();
}

class _TicketNotificationWidgetState
    extends ConsumerState<TicketNotificationWidget> {
  Place? _place;
  LatLng? _coordinates;
  bool _loadingPlace = true;
  bool _loadingMap = false;
  String? _loadError;

  @override
  void initState() {
    super.initState();
    _loadPlaceAndCoordinates();
  }

  @override
  void didUpdateWidget(covariant TicketNotificationWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.ticket.placeId != widget.ticket.placeId) {
      _loadPlaceAndCoordinates();
    }
  }

  Future<void> _loadPlaceAndCoordinates() async {
    setState(() {
      _loadingPlace = true;
      _loadError = null;
      _place = null;
      _coordinates = null;
    });

    try {
      final place =
          await ref.read(placeRepositoryProvider).getById(widget.ticket.placeId);
      setState(() {
        _place = place;
        _loadingPlace = false;
        _loadingMap = true;
      });

      final coords = await resolvePlaceCoordinates(
        placeId: place.id,
        address: place.address,
      );
      if (!mounted) return;
      setState(() {
        _coordinates = coords;
        _loadingMap = false;
      });
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() {
        _loadingPlace = false;
        _loadingMap = false;
        _loadError = error.message;
        _coordinates = seedCoordinatesForPlace(widget.ticket.placeId) ??
            kQueretaroFallback;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loadingPlace = false;
        _loadingMap = false;
        _loadError = 'No se pudo cargar la ubicación.';
        _coordinates = seedCoordinatesForPlace(widget.ticket.placeId) ??
            kQueretaroFallback;
      });
    }
  }

  void _openDirections() {
    if (_coordinates == null) return;
    context.push('/place/${widget.ticket.placeId}/directions');
  }

  @override
  Widget build(BuildContext context) {
    final ticket = widget.ticket;
    final statusLabel = ticketStatusLabel(ticket.status);
    final placeName = _place?.name ?? ticket.placeName;
    final address = _place?.address;
    final coords = _coordinates;

    return Card(
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            color: TurnixColors.accent,
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'TU TURNO ACTIVO',
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: TurnixColors.accentForeground
                                .withValues(alpha: 0.8),
                            letterSpacing: 1.2,
                          ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        statusLabel,
                        style: const TextStyle(
                          color: TurnixColors.accent,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  ticket.number,
                  style: Theme.of(context).textTheme.displayMedium?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  placeName,
                  style: const TextStyle(color: Colors.white70),
                ),
                if (_loadingPlace)
                  const Padding(
                    padding: EdgeInsets.only(top: 10),
                    child: LinearProgressIndicator(
                      minHeight: 2,
                      color: Colors.white,
                      backgroundColor: Color(0x55FFFFFF),
                    ),
                  )
                else if (address != null && address.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    address,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.72),
                      fontSize: 13,
                    ),
                  ),
                ],
                if (_loadError != null) ...[
                  const SizedBox(height: 6),
                  Text(
                    _loadError!,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.75),
                      fontSize: 12,
                    ),
                  ),
                ],
              ],
            ),
          ),
          SizedBox(
            height: 180,
            child: _loadingMap || coords == null
                ? ColoredBox(
                    color: TurnixColors.accent.withValues(alpha: 0.06),
                    child: const Center(child: CircularProgressIndicator()),
                  )
                : Stack(
                    fit: StackFit.expand,
                    children: [
                      FlutterMap(
                        options: MapOptions(
                          initialCenter: coords,
                          initialZoom: 15,
                          interactionOptions: const InteractionOptions(
                            flags: InteractiveFlag.none,
                          ),
                        ),
                        children: [
                          TileLayer(
                            urlTemplate:
                                'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                            userAgentPackageName:
                                'com.queueSystem.virtualqueue.phone',
                          ),
                          MarkerLayer(
                            markers: [
                              Marker(
                                point: coords,
                                width: 40,
                                height: 40,
                                child: Icon(
                                  Icons.location_on,
                                  color: TurnixColors.accent,
                                  size: 40,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      Material(
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: _openDirections,
                          child: const SizedBox.expand(),
                        ),
                      ),
                    ],
                  ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                _StatRow(
                  icon: Icons.groups_outlined,
                  label: 'Posición en fila',
                  value: '${ticket.position}',
                ),
                const Divider(height: 24),
                _StatRow(
                  icon: Icons.schedule_outlined,
                  label: 'Tiempo estimado',
                  value: '${ticket.estimatedMinutes} min',
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: coords == null ? null : _openDirections,
                        icon: const Icon(Icons.directions),
                        label: const Text('Cómo llegar'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: TurnixColors.accent,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 14,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: FilledButton(
                        onPressed: widget.onCancel,
                        style: FilledButton.styleFrom(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 14,
                          ),
                        ),
                        child: const Text('Cancelar turno'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatRow extends StatelessWidget {
  const _StatRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: TurnixColors.accent),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            label,
            style: TextStyle(color: TurnixColors.muted),
          ),
        ),
        Text(
          value,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
      ],
    );
  }
}
