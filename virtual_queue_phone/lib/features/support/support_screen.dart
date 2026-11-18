import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../theme/turnix_theme.dart';
import 'support_contact.dart';

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  final _messageController = TextEditingController();
  bool _sending = false;

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _open(Uri uri, String errorMessage) async {
    final opened = await SupportContact.open(uri);
    if (!mounted) return;
    if (!opened) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(errorMessage)),
      );
    }
  }

  Future<void> _sendMessage() async {
    final message = _messageController.text.trim();
    if (message.isEmpty || _sending) return;

    setState(() => _sending = true);
    try {
      await _open(
        SupportContact.mailto(
          subject: 'Soporte técnico Turnix',
          body: message,
        ),
        'No se pudo abrir el correo. Escríbenos a ${SupportContact.email}',
      );
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Future<void> _copyEmail() async {
    await Clipboard.setData(const ClipboardData(text: SupportContact.email));
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Correo copiado')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Soporte técnico')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text(
            '¿Necesitas ayuda?',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: 4),
          Text(
            'Escríbenos por correo, WhatsApp o teléfono. Horario: ${SupportContact.hours}.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: TurnixColors.muted,
                ),
          ),
          const SizedBox(height: 16),
          _ContactTile(
            icon: Icons.mail_outline,
            title: 'Correo',
            subtitle: SupportContact.email,
            onTap: () => _open(
              SupportContact.mailto(subject: 'Soporte técnico Turnix'),
              'No se pudo abrir el correo. Escríbenos a ${SupportContact.email}',
            ),
            onLongPress: _copyEmail,
          ),
          const SizedBox(height: 8),
          _ContactTile(
            icon: Icons.chat_outlined,
            title: 'WhatsApp',
            subtitle: SupportContact.phoneDisplay,
            onTap: () => _open(
              SupportContact.whatsapp,
              'No se pudo abrir WhatsApp',
            ),
          ),
          const SizedBox(height: 8),
          _ContactTile(
            icon: Icons.phone_outlined,
            title: 'Teléfono',
            subtitle: SupportContact.phoneDisplay,
            onTap: () => _open(
              SupportContact.tel,
              'No se pudo iniciar la llamada',
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Enviar un mensaje',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _messageController,
            minLines: 4,
            maxLines: 6,
            textInputAction: TextInputAction.newline,
            decoration: const InputDecoration(
              hintText: 'Describe el problema o la duda',
            ),
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: _sending ? null : _sendMessage,
            icon: _sending
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.send_outlined),
            label: const Text('Enviar por correo'),
          ),
        ],
      ),
    );
  }
}

class _ContactTile extends StatelessWidget {
  const _ContactTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.onLongPress,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final VoidCallback? onLongPress;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: TurnixColors.accent.withValues(alpha: 0.12),
          foregroundColor: TurnixColors.accent,
          child: Icon(icon),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
        onLongPress: onLongPress,
      ),
    );
  }
}
