import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:virtual_queue_core/virtual_queue_core.dart';

import '../../providers/phone_ticket_provider.dart';
import '../../theme/turnix_theme.dart';
import '../../widgets/api_error_panel.dart';
import '../../widgets/confirm_cancel_ticket_dialog.dart';
import '../../widgets/ticket_notification_widget.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  Future<void> _cancelTicket(BuildContext context, WidgetRef ref) async {
    final confirmed = await confirmCancelTicket(context);
    if (!confirmed) return;

    try {
      await ref.read(phoneTicketControllerProvider).cancelActiveTicket();
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Turno cancelado')),
        );
      }
    } on ApiException catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.message)),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ticketState = ref.watch(phoneTicketProvider);

    if (ticketState.loadState == PhoneTicketLoadState.loading &&
        ticketState.ticket == null) {
      return const Center(child: CircularProgressIndicator());
    }

    if (ticketState.loadState == PhoneTicketLoadState.error &&
        ticketState.ticket == null) {
      return ListView(
        padding: const EdgeInsets.all(20),
        children: [
          ApiErrorPanel(
            message: ticketState.errorMessage ?? 'Error al cargar el turno',
            onRetry: () => ref.read(phoneTicketControllerProvider).refresh(),
          ),
        ],
      );
    }

    final ticket = ticketState.ticket;

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text(
          'Mi turno',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w600,
              ),
        ),
        const SizedBox(height: 4),
        Text(
          'Consulta el estado de tu turno activo.',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: TurnixColors.muted,
              ),
        ),
        const SizedBox(height: 16),
        if (ticket != null && ticketState.hasActiveTicket)
          TicketNotificationWidget(
            ticket: ticket,
            onCancel: () => _cancelTicket(context, ref),
          )
        else
          Card(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 20),
              child: Column(
                children: [
                  Icon(Icons.confirmation_number_outlined,
                      size: 48, color: TurnixColors.accent.withValues(alpha: 0.85)),
                  const SizedBox(height: 12),
                  const Text(
                    'No tienes un turno activo',
                    style: TextStyle(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Busca un establecimiento y toma tu lugar en la fila.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: TurnixColors.muted, fontSize: 14),
                  ),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: () => context.go('/search'),
                    child: const Text('Buscar establecimientos'),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}
