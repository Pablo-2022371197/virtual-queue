import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';

/// Coordenadas aproximadas de los establecimientos semilla (desarrollo).
const _seedCoordinates = <String, LatLng>{
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa': LatLng(20.5881, -100.3881),
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb': LatLng(20.6108, -100.4053),
};

/// Centro de Querétaro como respaldo.
const kQueretaroFallback = LatLng(20.5888, -100.3899);

LatLng? seedCoordinatesForPlace(String placeId) {
  return _seedCoordinates[placeId.toLowerCase()];
}

Future<LatLng> resolvePlaceCoordinates({
  required String placeId,
  required String address,
}) async {
  final seed = seedCoordinatesForPlace(placeId);
  if (seed != null) return seed;

  final query = address.trim();
  if (query.isEmpty) return kQueretaroFallback;

  try {
    final uri = Uri.https('nominatim.openstreetmap.org', '/search', {
      'q': '$query, Querétaro, México',
      'format': 'json',
      'limit': '1',
    });
    final response = await http.get(
      uri,
      headers: const {'User-Agent': 'TurnixPhone/1.0 (UTEQ Virtual Queue)'},
    );
    if (response.statusCode != 200) return kQueretaroFallback;

    final list = jsonDecode(response.body) as List<dynamic>;
    if (list.isEmpty) return kQueretaroFallback;

    final first = list.first as Map<String, dynamic>;
    final lat = double.tryParse(first['lat']?.toString() ?? '');
    final lon = double.tryParse(first['lon']?.toString() ?? '');
    if (lat == null || lon == null) return kQueretaroFallback;
    return LatLng(lat, lon);
  } catch (_) {
    return kQueretaroFallback;
  }
}

String googleMapsSearchUrl({
  required String address,
  LatLng? coordinates,
}) {
  if (coordinates != null) {
    final q = Uri.encodeComponent('${coordinates.latitude},${coordinates.longitude}');
    return 'https://www.google.com/maps/search/?api=1&query=$q';
  }
  final q = Uri.encodeComponent(address);
  return 'https://www.google.com/maps/search/?api=1&query=$q';
}

String googleMapsDirectionsUrl({
  required LatLng destination,
  LatLng? origin,
}) {
  final dest =
      Uri.encodeComponent('${destination.latitude},${destination.longitude}');
  if (origin != null) {
    final org = Uri.encodeComponent('${origin.latitude},${origin.longitude}');
    return 'https://www.google.com/maps/dir/?api=1&origin=$org&destination=$dest&travelmode=driving';
  }
  return 'https://www.google.com/maps/dir/?api=1&destination=$dest&travelmode=driving';
}
