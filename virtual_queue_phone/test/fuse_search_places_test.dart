import 'package:flutter_test/flutter_test.dart';
import 'package:virtual_queue_core/virtual_queue_core.dart';
import 'package:virtual_queue_phone/features/places/fuse_search_places.dart';

final _samplePlaces = [
  const Place(
    id: '1',
    name: 'Farmacia Central',
    address: 'Av. Principal 100',
    category: 'Salud',
    active: true,
  ),
  const Place(
    id: '2',
    name: 'Banco del Pueblo',
    address: 'Calle Juárez 45',
    category: 'Finanzas',
    active: true,
  ),
  const Place(
    id: '3',
    name: 'Cafetería Norte',
    address: 'Blvd. Reforma 12',
    category: 'Alimentos',
    active: true,
  ),
];

void main() {
  final fuse = createPlaceFuse(_samplePlaces);

  test('returns full catalog when query is shorter than 2 characters', () {
    expect(fuseSearchPlaces(fuse, _samplePlaces, ''), _samplePlaces);
    expect(fuseSearchPlaces(fuse, _samplePlaces, 'f'), _samplePlaces);
    expect(fuseSearchPlaces(fuse, _samplePlaces, ' '), _samplePlaces);
  });

  test('boundary: exactly 2 characters triggers fuzzy search', () {
    final results = fuseSearchPlaces(fuse, _samplePlaces, 'ba');
    expect(results, isNotEmpty);
  });

  test('matches by name', () {
    final results = fuseSearchPlaces(fuse, _samplePlaces, 'farmacia');
    expect(results, hasLength(1));
    expect(results.first.name, 'Farmacia Central');
  });

  test('matches by address', () {
    final results = fuseSearchPlaces(fuse, _samplePlaces, 'juarez');
    expect(results, hasLength(1));
    expect(results.first.name, 'Banco del Pueblo');
  });

  test('matches by category', () {
    final results = fuseSearchPlaces(fuse, _samplePlaces, 'alimentos');
    expect(results, hasLength(1));
    expect(results.first.name, 'Cafetería Norte');
  });

  test('tolerates close typos with fuzzy matching', () {
    final results = fuseSearchPlaces(fuse, _samplePlaces, 'farmcia');
    expect(results, hasLength(1));
    expect(results.first.name, 'Farmacia Central');
  });

  test('returns empty list when nothing matches', () {
    final results = fuseSearchPlaces(fuse, _samplePlaces, 'zzzznotfound');
    expect(results, isEmpty);
  });
}
