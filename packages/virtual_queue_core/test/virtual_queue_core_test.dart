import 'package:flutter_test/flutter_test.dart';
import 'package:virtual_queue_core/virtual_queue_core.dart';

void main() {
  test('Place.fromJson maps fields', () {
    final place = Place.fromJson({
      'id': 'abc',
      'name': 'Sucursal',
      'address': 'Calle 1',
      'category': 'Banco',
      'active': true,
    });
    expect(place.id, 'abc');
    expect(place.name, 'Sucursal');
    expect(place.category, 'Banco');
    expect(place.active, isTrue);
  });
}
