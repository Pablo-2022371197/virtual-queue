enum UserRole { customer, staff, admin }

UserRole userRoleFromString(String? value) {
  switch (value?.toUpperCase()) {
    case 'STAFF':
      return UserRole.staff;
    case 'ADMIN':
      return UserRole.admin;
    default:
      return UserRole.customer;
  }
}

class UserSummary {
  const UserSummary({
    required this.id,
    required this.username,
    required this.fullName,
    required this.role,
  });

  final String id;
  final String username;
  final String fullName;
  final UserRole role;

  factory UserSummary.fromJson(Map<String, dynamic> json) {
    return UserSummary(
      id: json['id']?.toString() ?? '',
      username: json['username']?.toString() ?? '',
      fullName: json['fullName']?.toString() ?? '',
      role: userRoleFromString(json['role']?.toString()),
    );
  }
}
