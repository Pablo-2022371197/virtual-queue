import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:virtual_queue_core/virtual_queue_core.dart';

import '../../providers/phone_ticket_provider.dart';
import '../../theme/turnix_theme.dart';
import '../../widgets/api_error_panel.dart';

class PlaceDetailScreen extends ConsumerStatefulWidget {
  const PlaceDetailScreen({super.key, required this.placeId});

  final String placeId;

  @override
  ConsumerState<PlaceDetailScreen> createState() => _PlaceDetailScreenState();
}

class _PlaceDetailScreenState extends ConsumerState<PlaceDetailScreen> {
  Place? _place;
  bool _loading = true;
  bool _takingTicket = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final place = await ref.read(placeRepositoryProvider).getById(widget.placeId);
      setState(() {
        _place = place;
        _loading = false;
      });
    } on ApiException catch (error) {
      setState(() {
        _loading = false;
        _error = error.message;
      });
    } catch (_) {
      setState(() {
        _loading = false;
        _error = 'No se pudo cargar el establecimiento.';
      });
    }
  }

  Future<void> _takeTicket() async {
    if (_takingTicket) return;
    setState(() => _takingTicket = true);
    try {
      await ref.read(phoneTicketControllerProvider).takeTicket(widget.placeId);
      if (mounted) context.go('/home');
    } on ApiException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.message)),
        );
      }
    } finally {
      if (mounted) setState(() => _takingTicket = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Establecimiento')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_error != null || _place == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Establecimiento')),
        body: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            ApiErrorPanel(
              message: _error ?? 'Lugar no encontrado',
              onRetry: _load,
            ),
          ],
        ),
      );
    }

    final place = _place!;
    final hasActiveTicket = ref.watch(phoneTicketProvider).hasActiveTicket;

    return Scaffold(
      appBar: AppBar(title: Text(place.name)),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Chip(
            label: Text(place.category),
            backgroundColor: TurnixColors.accent.withValues(alpha: 0.12),
            labelStyle: const TextStyle(color: TurnixColors.accent),
            side: BorderSide.none,
          ),
          const SizedBox(height: 12),
          Text(
            place.address,
            style: TextStyle(color: TurnixColors.muted, fontSize: 15),
          ),
          const SizedBox(height: 16),
          if (place.description != null && place.description!.isNotEmpty)
            Text(place.description!),
          const SizedBox(height: 24),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Fila virtual',
                    style: TextStyle(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Al tomar turno se registrará en el servidor y verás la notificación en Mi turno.',
                    style: TextStyle(color: TurnixColors.muted, fontSize: 14),
                  ),
                ],
              ),
            ),
          ),
          if (hasActiveTicket) ...[
            const SizedBox(height: 12),
            Text(
              'Ya tienes un turno activo. Cancélalo en Mi turno antes de tomar otro.',
              style: TextStyle(color: TurnixColors.muted, fontSize: 14),
            ),
          ],
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () => context.push('/place/${place.id}/directions'),
            icon: const Icon(Icons.directions),
            label: const Text('Cómo llegar'),
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed:
                _takingTicket || hasActiveTicket ? null : _takeTicket,
            child: _takingTicket
                ? const SizedBox(
                    height: 22,
                    width: 22,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text(hasActiveTicket ? 'Turno activo en curso' : 'Tomar turno'),
          ),
        ],
      ),
    );
  }
}
