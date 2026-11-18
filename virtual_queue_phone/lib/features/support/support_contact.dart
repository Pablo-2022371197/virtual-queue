import 'package:url_launcher/url_launcher.dart';

/// Datos de contacto alineados con `siteConfig` de la web Turnix.
class SupportContact {
  static const email = 'contacto@turnix.uteq.edu.mx';
  static const phoneDisplay = '+52 442 123 4567';
  static const phoneE164 = '+524421234567';
  static const whatsappUrl = 'https://wa.me/524421234567';
  static const hours = 'Lunes a viernes · 8:00 – 17:00';

  static Uri mailto({String? subject, String? body}) {
    final params = <String>[];
    if (subject != null && subject.isNotEmpty) {
      params.add('subject=${Uri.encodeComponent(subject)}');
    }
    if (body != null && body.isNotEmpty) {
      params.add('body=${Uri.encodeComponent(body)}');
    }
    final query = params.isEmpty ? '' : '?${params.join('&')}';
    return Uri.parse('mailto:$email$query');
  }

  static Uri get tel => Uri(scheme: 'tel', path: phoneE164);

  static Uri get whatsapp => Uri.parse(whatsappUrl);

  static Future<bool> open(Uri uri) {
    return launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}
