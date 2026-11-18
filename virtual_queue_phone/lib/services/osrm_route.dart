import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';

const _osrmUserAgent = 'TurnixPhone/1.0 (UTEQ Virtual Queue)';

class OsrmRouteResult {
  const OsrmRouteResult({
    required this.points,
    required this.distanceMeters,
    required this.durationSeconds,
  });

  final List<LatLng> points;
  final double distanceMeters;
  final double durationSeconds;
}

Future<OsrmRouteResult?> fetchDrivingRoute({
  required LatLng origin,
  required LatLng destination,
}) async {
  final path =
      '${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}';
  final uri = Uri.https('router.project-osrm.org', '/route/v1/driving/$path', {
    'overview': 'full',
    'geometries': 'geojson',
  });

  try {
    final response = await http.get(
      uri,
      headers: const {'User-Agent': _osrmUserAgent},
    );
    if (response.statusCode != 200) return null;

    final body = jsonDecode(response.body) as Map<String, dynamic>;
    if (body['code'] != 'Ok') return null;

    final routes = body['routes'] as List<dynamic>?;
    if (routes == null || routes.isEmpty) return null;

    final route = routes.first as Map<String, dynamic>;
    final geometry = route['geometry'] as Map<String, dynamic>?;
    final coordinates = geometry?['coordinates'] as List<dynamic>?;
    if (coordinates == null || coordinates.isEmpty) return null;

    final points = coordinates.map((entry) {
      final pair = entry as List<dynamic>;
      final lon = (pair[0] as num).toDouble();
      final lat = (pair[1] as num).toDouble();
      return LatLng(lat, lon);
    }).toList();

    final distance = (route['distance'] as num?)?.toDouble() ?? 0;
    final duration = (route['duration'] as num?)?.toDouble() ?? 0;

    return OsrmRouteResult(
      points: points,
      distanceMeters: distance,
      durationSeconds: duration,
    );
  } catch (_) {
    return null;
  }
}

String formatRouteDistance(double meters) {
  if (meters >= 1000) {
    return '${(meters / 1000).toStringAsFixed(1)} km';
  }
  return '${meters.round()} m';
}

String formatRouteDuration(double seconds) {
  final minutes = (seconds / 60).round();
  if (minutes < 60) {
    return '$minutes min';
  }
  final hours = minutes ~/ 60;
  final rem = minutes % 60;
  if (rem == 0) return '$hours h';
  return '$hours h $rem min';
}
