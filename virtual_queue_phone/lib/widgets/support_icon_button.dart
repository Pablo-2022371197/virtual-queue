import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../theme/turnix_theme.dart';

class SupportIconButton extends StatelessWidget {
  const SupportIconButton({super.key});

  @override
  Widget build(BuildContext context) {
    return IconButton.outlined(
      tooltip: 'Soporte técnico',
      onPressed: () => context.push('/support'),
      style: IconButton.styleFrom(
        foregroundColor: TurnixColors.accent,
        side: const BorderSide(color: TurnixColors.accent, width: 1.5),
      ),
      icon: const Icon(Icons.support_agent),
    );
  }
}
