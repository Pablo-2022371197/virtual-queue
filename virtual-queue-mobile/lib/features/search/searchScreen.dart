import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/http/dioClient.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  List<dynamic> _places = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadPlaces();
  }

  Future<void> _loadPlaces() async {
    final dio = ref.read(dioProvider);
    final response = await dio.get('/api/places');
    setState(() {
      _places = response.data as List<dynamic>;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Buscar establecimientos')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: _places.length,
              itemBuilder: (context, index) {
                final place = _places[index] as Map<String, dynamic>;
                return ListTile(
                  title: Text(place['name']?.toString() ?? ''),
                  subtitle: Text(place['address']?.toString() ?? ''),
                  onTap: () => context.go('/place/${place['id']}/queue'),
                );
              },
            ),
    );
  }
}
