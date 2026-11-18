import 'package:flutter/material.dart';

Future<bool> confirmCancelTicket(BuildContext context) async {
  final result = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('Cancelar turno'),
      content: const Text(
        '¿Seguro que deseas cancelar tu turno? Perderás tu lugar en la fila.',
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(false),
          child: const Text('No'),
        ),
        FilledButton(
          onPressed: () => Navigator.of(context).pop(true),
          child: const Text('Sí, cancelar'),
        ),
      ],
    ),
  );
  return result == true;
}
