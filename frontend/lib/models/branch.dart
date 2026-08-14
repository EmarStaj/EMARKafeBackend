class Branch {
  final String id;
  final String name;
  final String? address;
  final bool isActive;

  const Branch({
    required this.id,
    required this.name,
    this.address,
    this.isActive = true,
  });

  factory Branch.fromDb(Map<String, dynamic> row) => Branch(
        id: row['id'] as String,
        name: row['name'] as String,
        address: row['address'] as String?,
        isActive: row['is_active'] as bool? ?? true,
      );
}
