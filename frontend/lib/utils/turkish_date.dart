const List<String> _turkishMonths = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

String formatTurkishDate(DateTime date) => '${date.day} ${_turkishMonths[date.month - 1]} ${date.year}';
