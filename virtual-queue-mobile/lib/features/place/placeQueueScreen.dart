import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/errors/api_exception.dart';
import '../../features/places/place_repository.dart';
import '../../models/place.dart';
import '../../models/queue.dart';
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
                        Text('Ventanillas abiertas: ${_queue!.openCounters}'),
                        Text(
                          'Tiempo promedio: ${_queue!.averageServiceMinutes} min',
                        ),
                      ],
                      const Spacer(),
                      if (activeTicket != null)
                        const Text(
                          'Ya tienes un turno activo. Cancélalo antes de tomar otro.',
                          style: TextStyle(color: Colors.orange),
                        )
                      else
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton(
                            onPressed: _taking ? null : _takeTicket,
                            child: _taking
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(strokeWidth: 2),
                                  )
                                : const Text('Tomar turno'),
                          ),
                        ),
                    ],
                  ),
                ),
    );
  }
}
