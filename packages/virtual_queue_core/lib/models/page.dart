class PageResult<T> {
  const PageResult({
    required this.content,
    required this.totalElements,
    required this.totalPages,
    required this.size,
    required this.number,
  });

  final List<T> content;
  final int totalElements;
  final int totalPages;
  final int size;
  final int number;

  factory PageResult.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic>) fromJsonT,
  ) {
    final raw = json['content'];
    final items = raw is List
        ? raw
            .whereType<Map>()
            .map((e) => fromJsonT(Map<String, dynamic>.from(e)))
            .toList()
        : <T>[];
    return PageResult(
      content: items,
      totalElements: json['totalElements'] is int
          ? json['totalElements'] as int
          : int.tryParse(json['totalElements']?.toString() ?? '0') ?? 0,
      totalPages: json['totalPages'] is int
          ? json['totalPages'] as int
          : int.tryParse(json['totalPages']?.toString() ?? '0') ?? 0,
      size: json['size'] is int
          ? json['size'] as int
          : int.tryParse(json['size']?.toString() ?? '0') ?? 0,
      number: json['number'] is int
          ? json['number'] as int
          : int.tryParse(json['number']?.toString() ?? '0') ?? 0,
    );
  }
}
