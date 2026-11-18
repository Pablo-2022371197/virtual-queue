import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:geolocator/geolocator.dart';
import 'package:virtual_queue_phone/services/user_location.dart';

void main() {
  group('resolveUserLocation', () {
    test('location service disabled returns error', () async {
      final result = await resolveUserLocation(
        dependencies: UserLocationDependencies(
          isLocationServiceEnabled: () async => false,
        ),
      );
      expect(result.hasPosition, isFalse);
      expect(result.errorMessage, contains('Activa la ubicación'));
    });

    test('permission denied returns error', () async {
      final result = await resolveUserLocation(
        dependencies: UserLocationDependencies(
          isLocationServiceEnabled: () async => true,
          checkPermission: () async => LocationPermission.denied,
          requestPermission: () async => LocationPermission.denied,
        ),
      );
      expect(result.errorMessage, contains('permiso'));
    });

    test('position timeout returns error without hanging', () async {
      final result = await resolveUserLocation(
        positionTimeLimit: const Duration(milliseconds: 50),
        dependencies: UserLocationDependencies(
          isLocationServiceEnabled: () async => true,
          checkPermission: () async => LocationPermission.whileInUse,
          getCurrentPosition: ({required Duration timeLimit}) async {
            await Future<void>.delayed(const Duration(seconds: 30));
            throw StateError('should not complete');
          },
        ),
      );
      expect(result.hasPosition, isFalse);
      expect(result.errorMessage, contains('Tiempo agotado'));
    });
  });
}