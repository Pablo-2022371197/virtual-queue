import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/auth/auth_service.dart';
import '../../core/errors/api_exception.dart';
import '../../core/format/datetime.dart';
import '../../core/format/counter_label.dart';
import '../../features/places/place_repository.dart';
import '../../models/place.dart';
import '../../models/queue.dart';
import '../../models/ticket.dart';
import '../../models/user_summary.dart';
import '../../providers/active_ticket_provider.dart';

class PlaceQueueScreen extends ConsumerStatefulWidget {
  const PlaceQueueScreen({super.key, required this.placeId});

  final String placeId;

  @override
  ConsumerState<PlaceQueueScreen> createState() => _PlaceQueueScreenState();
}

class _PlaceQueueScreenState extends ConsumerState<PlaceQueueScreen> {
  Place? _place;
  QueueInfo? _queue;
  bool _loading = true;
  String? _error;
  bool _taking = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final repo = ref.read(placeRepositoryProvider);
      final place = await repo.getById(widget.placeId);
      final queue = await repo.getQueue(widget.placeId);
      setState(() {
        _place = place;
        _queue = queue;
        _loading = false;
      });
    } on ApiException catch (error) {
      setState(() {
        _error = error.message;
        _loading = false;
      });
    } catch (_) {
      setState(() {
        _error = 'No se pudo cargar el establecimiento.';
        _loading = false;
      });
    }
  }

  Future<void> _takeTicket() async {
    setState(() => _taking = true);
    try {
      await ref.read(activeTicketProvider.notifier).takeTicket(widget.placeId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Turno tomado correctamente')),
        );
        Navigator.of(context).pop();
      }
    } on ApiException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.message)),
        );
      }
    } finally {
      if (mounted) setState(() => _taking = false);
    }
  }

  Widget _buildTicketStatus(Ticket? activeTicket) {
    final role = ref.watch(authStateProvider).user?.role;
    if (role != null && role != UserRole.customer) {
      return const Text(
        'El personal no toma turnos. Atiende la fila desde el panel web.',
        style: TextStyle(color: Colors.orange),
      );
    }

    if (activeTicket == null) {
      return SizedBox(
        width: double.infinity,
        child: FilledButton(
          onPressed: (_taking || _queue?.active != true) ? null : _takeTicket,
          child: _taking
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('Tomar turno'),
        ),
      );
    }

    final hasTicketHere = activeTicket.placeId == widget.placeId;
    if (hasTicketHere) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Ya tienes el turno ${activeTicket.number} en este establecimiento.',
            style: const TextStyle(color: Colors.green),
          ),
          if (activeTicket.issuedAt != null && activeTicket.issuedAt!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                'Expedido: ${formatDateTime(activeTicket.issuedAt)}',
                style: const TextStyle(fontSize: 13, color: Colors.black54),
              ),
            ),
          if (activeTicket.status == TicketStatus.called ||
              activeTicket.status == TicketStatus.serving)
            if (activeTicket.counterNumber != null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  'Dirígete a la caja ${counterDisplay(activeTicket.counterNumber, activeTicket.counterLabel)}',
                  style: const TextStyle(color: Colors.blueAccent),
                ),
              ),
        ],
      );
    }

    return const Text(
      'Ya tienes un turno activo en otro establecimiento. Cancélalo primero.',
      style: TextStyle(color: Colors.orange),
    );
  }

  @override
  Widget build(BuildContext context) {
    final activeTicket = ref.watch(activeTicketProvider).ticket;

    return Scaffold(
      appBar: AppBar(title: Text(_place?.name ?? 'Establecimiento')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(_error!),
                      const SizedBox(height: 12),
                      FilledButton(onPressed: _load, child: const Text('Reintentar')),
                    ],
                  ),
                )
              : Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (_place?.description != null &&
                          _place!.description!.isNotEmpty)
                        Text(_place!.description!),
                      const SizedBox(height: 8),
                      Text(_place?.address ?? ''),
                      const SizedBox(height: 16),
                      if (_queue != null) ...[
                        Text('Cajas: ${_queue!.openCounters}'),
                        Text(
                          'Tiempo promedio: ${_queue!.averageServiceMinutes} min',
                        ),
                      ],
                      const Spacer(),
                      _buildTicketStatus(activeTicket),
                    ],
                  ),
                ),
    );
  }
}
