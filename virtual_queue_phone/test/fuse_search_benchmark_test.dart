import 'package:flutter_test/flutter_test.dart';
import 'package:virtual_queue_core/virtual_queue_core.dart';
import 'package:virtual_queue_phone/features/places/fuse_search_places.dart';

/// WB-06: tiempo de búsqueda en catálogo grande (solo lógica, sin UI).
void main() {
  test('fuse search 500 places under 50ms median', () {
    final places = List.generate(
      500,
      (i) => Place(
        id: '$i',
        name: 'Establecimiento $i',
        address: 'Calle $i',
        category: i.isEven ? 'Salud' : 'Banco',
        active: true,
      ),
    );
    final fuse = createPlaceFuse(places);
    final samples = <int>[];
    for (var q = 0; q < 20; q++) {
      final sw = Stopwatch()..start();
      fuseSearchPlaces(fuse, places, 'estable $q');
      sw.stop();
      samples.add(sw.elapsedMicroseconds);
    }
    samples.sort();
    final median = samples[samples.length ~/ 2];
    expect(median, lessThan(50000), reason: 'mediana ${median}us');
  });
}
