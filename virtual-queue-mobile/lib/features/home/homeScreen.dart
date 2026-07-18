import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../providers/activeTicketProvider.dart';
import '../../services/queueListenerService.dart';

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
    });
  }

  @override
  Widget build(BuildContext context) {
    final ticketAsync = ref.watch(activeTicketProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Virtual Queue'),
        actions: [
          IconButton(
            onPressed: () => context.go('/search'),
            icon: const Icon(Icons.search),
          ),
        ],
      ),
      body: ticketAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('Error: $error')),
        data: (ticket) {
          if (ticket == null) {
            return const Center(child: Text('No tienes un turno activo.'));
          }

          return Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Turno #${ticket.number ?? ticket.id}'),
                Text('Posición: ${ticket.position ?? '-'}'),
                Text('Estimado: ${ticket.estimatedMinutes ?? '-'} min'),
              ],
            ),
          );
        },
      ),
    );
  }
}
