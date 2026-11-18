import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:virtual_queue_core/virtual_queue_core.dart';

import '../../services/osrm_route.dart';
import '../../services/place_location.dart';
import '../../services/user_location.dart';
import '../../theme/turnix_theme.dart';
import '../../widgets/api_error_panel.dart';

class PlaceDirectionsScreen extends ConsumerStatefulWidget {
  const PlaceDirectionsScreen({super.key, required this.placeId});

  final String placeId;

  @override
  ConsumerState<PlaceDirectionsScreen> createState() =>
      _PlaceDirectionsScreenState();
}

class _PlaceDirectionsScreenState extends ConsumerState<PlaceDirectionsScreen> {
  final MapController _mapController = MapController();

  Place? _place;
  LatLng? _destination;
  LatLng? _userPosition;
  List<LatLng> _routePoints = [];
  OsrmRouteResult? _route;
  bool _loading = true;
  String? _error;
  bool _openingMaps = false;

  @override
  void dispose() {
    _mapController.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
      _routePoints = [];
      _route = null;
      _userPosition = null;
      _destination = null;
    });

    try {
      final place =
          await ref.read(placeRepositoryProvider).getById(widget.placeId);
      final destination = await resolvePlaceCoordinates(
        placeId: place.id,
        address: place.address,
      );

      final userResult = await resolveUserLocation();
      OsrmRouteResult? route;
      String? routeWarning;

      if (userResult.hasPosition) {
        route = await fetchDrivingRoute(
          origin: userResult.position!,
          destination: destination,
        );
        if (route == null) {
          routeWarning = 'No se pudo calcular la ruta en el mapa.';
        }
      }

      if (!mounted) return;
      final locationWarning = userResult.errorMessage;
      setState(() {
        _place = place;
        _destination = destination;
        _userPosition = userResult.position;
        _route = route;
        _routePoints = route?.points ?? [];
        _loading = false;
      });

      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        _fitMap();
        final message = locationWarning ?? routeWarning;
        if (message != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(message)),
          );
        }
      });
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = error.message;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'No se pudo cargar la ruta.';
      });
    }
  }

  void _fitMap() {
    final destination = _destination;
    if (destination == null) return;

    final points = <LatLng>[destination];
    if (_userPosition != null) points.add(_userPosition!);
    if (_routePoints.isNotEmpty) points.addAll(_routePoints);

    if (points.length >= 2) {
      _mapController.fitCamera(
        CameraFit.coordinates(
          coordinates: points,
          padding: const EdgeInsets.all(48),
        ),
      );
    } else {
      _mapController.move(destination, 15);
    }
  }

  Future<void> _openExternalMaps() async {
    if (_openingMaps || _destination == null) return;
    setState(() => _openingMaps = true);
    try {
      final url = googleMapsDirectionsUrl(
        destination: _destination!,
        origin: _userPosition,
      );
      final uri = Uri.parse(url);
      if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('No se pudo abrir Google Maps')),
          );
        }
      }
    } finally {
      if (mounted) setState(() => _openingMaps = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Cómo llegar')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_error != null || _place == null || _destination == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Cómo llegar')),
        body: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            ApiErrorPanel(
              message: _error ?? 'Establecimiento no encontrado',
              onRetry: _load,
            ),
          ],
        ),
      );
    }

    final place = _place!;
    final destination = _destination!;
    final route = _route;

    return Scaffold(
      appBar: AppBar(title: Text('Ruta a ${place.name}')),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (route != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  Chip(
                    avatar: const Icon(Icons.straighten, size: 18),
                    label: Text(formatRouteDistance(route.distanceMeters)),
                  ),
                  Chip(
                    avatar: const Icon(Icons.schedule, size: 18),
                    label: Text(formatRouteDuration(route.durationSeconds)),
                  ),
                ],
              ),
            ),
          Expanded(
            child: FlutterMap(
              mapController: _mapController,
              options: MapOptions(
                initialCenter: destination,
                initialZoom: 14,
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.queueSystem.virtualqueue.phone',
                ),
                if (_routePoints.length >= 2)
                  PolylineLayer(
                    polylines: [
                      Polyline(
                        points: _routePoints,
                        strokeWidth: 5,
                        color: TurnixColors.accent,
                      ),
                    ],
                  ),
                MarkerLayer(
                  markers: [
                    if (_userPosition != null)
                      Marker(
                        point: _userPosition!,
                        width: 40,
                        height: 40,
                        child: const Icon(
                          Icons.my_location,
                          color: Colors.blue,
                          size: 36,
                        ),
                      ),
                    Marker(
                      point: destination,
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
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  place.address,
                  style: TextStyle(color: TurnixColors.muted, fontSize: 14),
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: _openingMaps ? null : _openExternalMaps,
                  icon: _openingMaps
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.open_in_new),
                  label: const Text('Abrir en Google Maps'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
