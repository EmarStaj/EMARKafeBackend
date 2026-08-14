import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/app_state.dart';
import '../theme.dart';

Future<void> showBranchPicker(BuildContext context) {
  final app = context.read<AppState>();
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: EmarColors.surface,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
    ),
    builder: (sheetContext) {
      return SafeArea(
        child: ConstrainedBox(
          constraints: BoxConstraints(maxHeight: MediaQuery.of(sheetContext).size.height * 0.7),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 8),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Şube Seç', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 4),
                Text(
                  '${app.branches.length} şehirdeki EMAR Kafe şubelerinden birini seç',
                  style: TextStyle(fontSize: 12.5, color: EmarColors.espresso.withValues(alpha: 0.55)),
                ),
                const SizedBox(height: 8),
                Flexible(
                  child: ListView.builder(
                    shrinkWrap: true,
                    padding: const EdgeInsets.only(bottom: 12),
                    itemCount: app.branches.length,
                    itemBuilder: (context, i) {
                      final branch = app.branches[i];
                      final selected = branch.id == app.selectedBranchId;
                      return ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: Icon(
                          selected ? Icons.location_on : Icons.location_on_outlined,
                          color: selected ? EmarColors.paprika : EmarColors.espresso.withValues(alpha: 0.4),
                        ),
                        title: Text(
                          branch.name,
                          style: TextStyle(fontWeight: selected ? FontWeight.w700 : FontWeight.w500),
                        ),
                        trailing: selected ? const Icon(Icons.check, color: EmarColors.moss) : null,
                        onTap: () {
                          app.selectBranch(branch.id);
                          Navigator.of(sheetContext).pop();
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    },
  );
}
