import 'package:flutter/material.dart';

class PlaceQueueScreen extends StatelessWidget {
  const PlaceQueueScreen({super.key, required this.placeId});

  final String placeId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Fila del establecimiento')),
      body: Center(
        child: Text('Establecimiento $placeId'),
      ),
    );
  }
}
