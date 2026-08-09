class Place {
  const Place({
    required this.id,
    required this.name,
    required this.address,
    required this.category,
    this.description,
    required this.active,
    this.createdAt,
  });

  final String id;
  final String name;
  final String address;
  final String category;
  final String? description;
  final bool active;
  final String? createdAt;

  factory Place.fromJson(Map<String, dynamic> json) {
    return Place(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      address: json['address']?.toString() ?? '',
      category: json['category']?.toString() ?? '',
      description: json['description']?.toString(),
      active: json['active'] == true,
      createdAt: json['createdAt']?.toString(),
    );
  }
}

class PageResult<T> {
  const PageResult({
    required this.content,
    required this.totalElements,
  });

  final List<T> content;
  final int totalElements;

  factory PageResult.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic>) fromJsonT,
  ) {
    final raw = json['content'];
    final items = raw is List
        ? raw
            .whereType<Map>()
            .map((item) => fromJsonT(item.cast<String, dynamic>()))
            .toList()
        : <T>[];
    return PageResult(
      content: items,
      totalElements: json['totalElements'] is int
          ? json['totalElements'] as int
          : int.tryParse(json['totalElements']?.toString() ?? '0') ?? 0,
    );
  }
}
