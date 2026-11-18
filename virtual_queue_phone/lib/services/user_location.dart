import 'dart:async';

import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';

/// Result of attempting to read the device location once.
class UserLocationResult {
  const UserLocationResult({this.position, this.errorMessage});

  final LatLng? position;
  final String? errorMessage;

  bool get hasPosition => position != null;
}

/// Injectable dependencies for tests (evita ANR al acotar tiempo de espera).
class UserLocationDependencies {
  UserLocationDependencies({
    Future<bool> Function()? isLocationServiceEnabled,
    Future<LocationPermission> Function()? checkPermission,
    Future<LocationPermission> Function()? requestPermission,
    Future<Position> Function({
      required Duration timeLimit,
    })? getCurrentPosition,
  })  : isLocationServiceEnabled =
            isLocationServiceEnabled ?? Geolocator.isLocationServiceEnabled,
        checkPermission = checkPermission ?? Geolocator.checkPermission,
        requestPermission = requestPermission ?? Geolocator.requestPermission,
        getCurrentPosition = getCurrentPosition ??
            (({required Duration timeLimit}) {
              return Geolocator.getCurrentPosition(
                locationSettings: LocationSettings(
                  timeLimit: timeLimit,
                ),
              );
            });

  final Future<bool> Function() isLocationServiceEnabled;
  final Future<LocationPermission> Function() checkPermission;
  final Future<LocationPermission> Function() requestPermission;
  final Future<Position> Function({
    required Duration timeLimit,
  }) getCurrentPosition;
}

Future<UserLocationResult> resolveUserLocation({
  UserLocationDependencies? dependencies,
  Duration positionTimeLimit = const Duration(seconds: 8),
}) async {
  final deps = dependencies ?? UserLocationDependencies();

  final serviceEnabled = await deps.isLocationServiceEnabled();
  if (!serviceEnabled) {
    return const UserLocationResult(
      errorMessage: 'Activa la ubicación en tu dispositivo.',
    );
  }

  var permission = await deps.checkPermission();
  if (permission == LocationPermission.denied) {
    permission = await deps.requestPermission();
  }

  if (permission == LocationPermission.denied) {
    return const UserLocationResult(
      errorMessage: 'Se necesita permiso de ubicación para trazar la ruta.',
    );
  }

  if (permission == LocationPermission.deniedForever) {
    return const UserLocationResult(
      errorMessage:
          'El permiso de ubicación está bloqueado. Actívalo en ajustes del sistema.',
    );
  }

  try {
    final position = await deps
        .getCurrentPosition(timeLimit: positionTimeLimit)
        .timeout(positionTimeLimit);
    return UserLocationResult(
      position: LatLng(position.latitude, position.longitude),
    );
  } on TimeoutException {
    return const UserLocationResult(
      errorMessage: 'Tiempo agotado al obtener tu ubicación.',
    );
  } catch (_) {
    return const UserLocationResult(
      errorMessage: 'No se pudo obtener tu ubicación.',
    );
  }
}