import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/errors/api_exception.dart';
import '../../features/places/place_repository.dart';
import '../../models/place.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _queryController = TextEditingController();
  List<Place> _places = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadPlaces();
  }

  @override
  void dispose() {
    _queryController.dispose();
    super.dispose();
  }

  Future<void> _loadPlaces({String? query}) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final places = await ref.read(placeRepositoryProvider).search(query: query);
      setState(() {
        _places = places;
        _loading = false;
      });
    } on ApiException catch (error) {
      setState(() {
        _error = error.message;
        _loading = false;
      });
    } catch (_) {
      setState(() {
        _error = 'No se pudieron cargar los establecimientos.';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Buscar establecimientos')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _queryController,
              decoration: InputDecoration(
                labelText: 'Buscar',
                suffixIcon: IconButton(
                  icon: const Icon(Icons.search),
                  onPressed: () => _loadPlaces(query: _queryController.text.trim()),
                ),
                border: const OutlineInputBorder(),
              ),
              onSubmitted: (value) => _loadPlaces(query: value.trim()),
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(_error!),
                            const SizedBox(height: 12),
                            FilledButton(
                              onPressed: () => _loadPlaces(),
                              child: const Text('Reintentar'),
                            ),
                          ],
                        ),
                      )
                    : _places.isEmpty
                        ? const Center(child: Text('Sin resultados'))
                        : ListView.builder(
                            itemCount: _places.length,
                            itemBuilder: (context, index) {
                              final place = _places[index];
                              return ListTile(
                                title: Text(place.name),
                                subtitle: Text(place.address),
                                onTap: () => context.go('/place/${place.id}/queue'),
                              );
                            },
                          ),
          ),
        ],
      ),
    );
  }
}
