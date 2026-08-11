/// Maps counter index 1 → A, 2 → B, …
String counterLabel(int? n) {
  if (n == null || n < 1) return '';
  if (n <= 26) {
    return String.fromCharCode(64 + n);
  }
  return '$n';
}

String counterDisplay(int? number, [String? label]) {
  final code = (label != null && label.isNotEmpty) ? label : counterLabel(number);
  return code;
}
