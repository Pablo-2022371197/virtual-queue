import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/auth/auth_service.dart';
import '../../core/format/datetime.dart';
import '../../core/format/counter_label.dart';
import '../../models/ticket.dart';
import '../../providers/active_ticket_provider.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(queueListenerServiceProvider).start();
      ref.read(activeTicketProvider.notifier).refresh();
    });
  }

  Future<void> _logout() async {
    ref.read(queueListenerServiceProvider).stop();
    await ref.read(authStateProvider.notifier).logout();
    if (mounted) context.go('/login');
  }

  Future<void> _cancelTicket(String ticketId) async {
    await ref.read(activeTicketProvider.notifier).cancelTicket(ticketId);
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authStateProvider);
    final ticketState = ref.watch(activeTicketProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Virtual Queue'),
        actions: [
          IconButton(
            onPressed: () => context.go('/search'),
            icon: const Icon(Icons.search),
          ),
          IconButton(
            onPressed: _logout,
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(activeTicketProvider.notifier).refresh(),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(24),
          children: [
            if (auth.user != null)
              Text(
                'Hola, ${auth.user!.fullName}',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
              ),
            const SizedBox(height: 16),
            if (ticketState.isLoading)
              const Center(child: CircularProgressIndicator())
            else if (ticketState.error != null)
              _ErrorCard(
                message: ticketState.error!,
                isNetwork: ticketState.isNetworkError,
                onRetry: () => ref.read(activeTicketProvider.notifier).refresh(),
              )
            else if (ticketState.ticket == null)
              const _EmptyTicketCard()
            else
              _TicketCard(
                ticket: ticketState.ticket!,
                onCancel: () => _cancelTicket(ticketState.ticket!.id),
              ),
          ],
        ),
      ),
    );
  }
}

class _EmptyTicketCard extends StatelessWidget {
  const _EmptyTicketCard();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            const Icon(Icons.confirmation_number_outlined, size: 48),
            const SizedBox(height: 12),
            const Text('No tienes un turno activo'),
            const SizedBox(height: 12),
            FilledButton(
              onPressed: () => context.go('/search'),
              child: const Text('Buscar establecimiento'),
            ),
          ],
        ),
      ),
    );
  }
}

class _TicketCard extends StatelessWidget {
  const _TicketCard({required this.ticket, required this.onCancel});

  final Ticket ticket;
  final VoidCallback onCancel;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              ticket.number,
              style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(ticket.placeName),
            const SizedBox(height: 8),
            Text('Posición: ${ticket.position}'),
            Text('Estimado: ${ticket.estimatedMinutes} min'),
            if (ticket.issuedAt != null && ticket.issuedAt!.isNotEmpty)
              Text('Expedido: ${formatDateTime(ticket.issuedAt)}'),
            Text('Estado: ${ticketStatusLabel(ticket.status)}'),
            if (ticket.counterNumber != null &&
                (ticket.status == TicketStatus.called ||
                    ticket.status == TicketStatus.serving))
              Text(
                'Caja: ${counterDisplay(ticket.counterNumber, ticket.counterLabel)}',
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: onCancel,
              child: const Text('Cancelar turno'),
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorCard extends StatelessWidget {
  const _ErrorCard({
    required this.message,
    required this.isNetwork,
    required this.onRetry,
  });

  final String message;
  final bool isNetwork;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Colors.red.shade50,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Icon(
              isNetwork ? Icons.wifi_off : Icons.error_outline,
              color: Colors.redAccent,
            ),
            const SizedBox(height: 8),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 12),
            FilledButton(onPressed: onRetry, child: const Text('Reintentar')),
          ],
        ),
      ),
    );
  }
}
