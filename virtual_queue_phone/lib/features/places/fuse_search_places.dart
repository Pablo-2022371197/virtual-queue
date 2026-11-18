import 'package:fuzzy/fuzzy.dart';
import 'package:virtual_queue_core/virtual_queue_core.dart';

Fuzzy<Place> createPlaceFuse(List<Place> places) {
  return Fuzzy(
    places,
    options: FuzzyOptions<Place>(
      threshold: 0.4,
      minMatchCharLength: 2,
      keys: [
        WeightedKey(name: 'name', getter: (p) => p.name, weight: 1),
        WeightedKey(name: 'address', getter: (p) => p.address, weight: 1),
        WeightedKey(name: 'category', getter: (p) => p.category, weight: 1),
      ],
    ),
  );
}

List<Place> fuseSearchPlaces(
  Fuzzy<Place> fuse,
  List<Place> catalog,
  String query,
) {
  final trimmed = query.trim();
  if (trimmed.length < 2) {
    return catalog;
  }

  return fuse.search(trimmed).map((result) => result.item).toList();
}
