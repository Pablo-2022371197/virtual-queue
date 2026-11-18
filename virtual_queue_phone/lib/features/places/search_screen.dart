import 'package:flutter/material.dart';
import 'package:fuzzy/fuzzy.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:virtual_queue_core/virtual_queue_core.dart';

import '../../theme/turnix_theme.dart';
import '../../widgets/api_error_panel.dart';
import 'fuse_search_places.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  String _query = '';
  bool _loading = true;
  String? _error;
  List<Place> _catalog = [];
  Fuzzy<Place>? _fuse;

  @override
  void initState() {
    super.initState();
    _loadCatalog();
  }

  Future<void> _loadCatalog() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final page = await ref.read(placeRepositoryProvider).search(size: 100);
      final catalog = page.content;
      setState(() {
        _catalog = catalog;
        _fuse = createPlaceFuse(catalog);
        _loading = false;
      });
    } on ApiException catch (error) {
      setState(() {
        _loading = false;
        _error = error.message;
        _catalog = [];
        _fuse = null;
      });
    } catch (_) {
      setState(() {
        _loading = false;
        _error = 'No se pudieron cargar los establecimientos.';
        _catalog = [];
        _fuse = null;
      });
    }
  }

  List<Place> get _results {
    final fuse = _fuse;
    if (fuse == null) return const [];
    return fuseSearchPlaces(fuse, _catalog, _query);
  }

  @override
  Widget build(BuildContext context) {
    final results = _results;
    final showNoMatches =
        _query.trim().length >= 2 && !_loading && results.isEmpty && _error == null;

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text(
          'Establecimientos',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w600,
              ),
        ),
        const SizedBox(height: 4),
        Text(
          'Encuentra un lugar y únete a su fila virtual.',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: TurnixColors.muted,
              ),
        ),
        const SizedBox(height: 16),
        TextField(
          decoration: const InputDecoration(
            labelText: 'Buscar establecimientos',
            hintText: 'Buscar por nombre, dirección o categoría…',
            prefixIcon: Icon(Icons.search),
          ),
          onChanged: (value) => setState(() => _query = value),
        ),
        const SizedBox(height: 16),
        if (_loading)
          const Padding(
            padding: EdgeInsets.all(32),
            child: Center(child: CircularProgressIndicator()),
          )
        else if (_error != null)
          ApiErrorPanel(
            message: _error!,
            onRetry: _loadCatalog,
          )
        else if (showNoMatches)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Text(
                'No se encontraron resultados para “$_query”.',
                textAlign: TextAlign.center,
                style: TextStyle(color: TurnixColors.muted),
              ),
            ),
          )
        else
          ...results.map((place) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Text(
                                place.name,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 16,
                                ),
                              ),
                            ),
                            Chip(
                              label: Text(place.category),
                              backgroundColor:
                                  TurnixColors.accent.withValues(alpha: 0.12),
                              labelStyle: const TextStyle(
                                color: TurnixColors.accent,
                                fontSize: 12,
                              ),
                              side: BorderSide.none,
                              visualDensity: VisualDensity.compact,
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          place.address,
                          style: TextStyle(color: TurnixColors.muted, fontSize: 14),
                        ),
                        if (place.description != null &&
                            place.description!.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Text(
                            place.description!,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: TurnixColors.muted,
                              fontSize: 12,
                            ),
                          ),
                        ],
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton(
                            onPressed: () => context.push('/place/${place.id}'),
                            child: const Text('Ver fila'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              )),
      ],
    );
  }
}
