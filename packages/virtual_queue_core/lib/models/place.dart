class Place {
  const Place({
    required this.id,
    required this.name,
    required this.address,
    required this.category,
    this.description,
    required this.active,
    this.createdAt,
    this.totalCounters,
  });

  final String id;
  final String name;
  final String address;
  final String category;
  final String? description;
  final bool active;
  final String? createdAt;
  final int? totalCounters;

  factory Place.fromJson(Map<String, dynamic> json) {
    return Place(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      address: json['address']?.toString() ?? '',
      category: json['category']?.toString() ?? '',
      description: json['description']?.toString(),
      active: json['active'] == true,
      createdAt: json['createdAt']?.toString(),
      totalCounters: json['totalCounters'] is int
          ? json['totalCounters'] as int
          : int.tryParse(json['totalCounters']?.toString() ?? ''),
    );
  }
}
