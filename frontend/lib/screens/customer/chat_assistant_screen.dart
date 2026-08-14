import 'package:flutter/material.dart';

import '../../services/assistant_service.dart';
import '../../theme.dart';
import '../../widgets/pressable_scale.dart';

class ChatAssistantScreen extends StatefulWidget {
  const ChatAssistantScreen({super.key});

  @override
  State<ChatAssistantScreen> createState() => _ChatAssistantScreenState();
}

class _ChatAssistantScreenState extends State<ChatAssistantScreen> {
  final _inputCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  final List<ChatTurn> _turns = [
    const ChatTurn(
      fromUser: false,
      text: 'Merhaba! Ben EMAR Kafe asistanıyım ☕ Canın ne çekiyor, yoksa sana bir şey mi önereyim?',
    ),
  ];
  bool _sending = false;

  @override
  void dispose() {
    _inputCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollCtrl.hasClients) return;
      _scrollCtrl.animateTo(
        _scrollCtrl.position.maxScrollExtent,
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
      );
    });
  }

  Future<void> _send() async {
    final text = _inputCtrl.text.trim();
    if (text.isEmpty || _sending) return;

    final history = List<ChatTurn>.from(_turns);
    setState(() {
      _turns.add(ChatTurn(fromUser: true, text: text));
      _inputCtrl.clear();
      _sending = true;
    });
    _scrollToBottom();

    try {
      final reply = await AssistantService.sendMessage(history: history, userMessage: text);
      setState(() => _turns.add(ChatTurn(fromUser: false, text: reply)));
    } catch (e) {
      setState(() => _turns.add(ChatTurn(fromUser: false, text: '⚠️ ${e.toString().replaceFirst('StateError: ', '')}')));
    } finally {
      setState(() => _sending = false);
      _scrollToBottom();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: EmarColors.oat,
      body: Column(
        children: [
          Container(
            width: double.infinity,
            color: EmarColors.espresso,
            padding: EdgeInsets.fromLTRB(8, MediaQuery.of(context).padding.top + 4, 20, 16),
            child: Row(
              children: [
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.arrow_back, color: EmarColors.surface),
                ),
                const SizedBox(width: 4),
                const CircleAvatar(radius: 16, backgroundColor: EmarColors.moss, child: Text('☕', style: TextStyle(fontSize: 14))),
                const SizedBox(width: 10),
                const Expanded(
                  child: Text('Kafe Asistanı', style: TextStyle(color: EmarColors.surface, fontFamily: 'Georgia', fontSize: 17, fontWeight: FontWeight.w700)),
                ),
              ],
            ),
          ),
          if (!AssistantService.isConfigured)
            Expanded(child: _MissingKeyNotice(onBack: () => Navigator.of(context).pop()))
          else ...[
            Expanded(
              child: ListView.builder(
                controller: _scrollCtrl,
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                itemCount: _turns.length + (_sending ? 1 : 0),
                itemBuilder: (context, i) {
                  if (i >= _turns.length) return const _TypingBubble();
                  return _ChatBubble(turn: _turns[i]);
                },
              ),
            ),
            SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 6, 12, 12),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _inputCtrl,
                        enabled: !_sending,
                        textInputAction: TextInputAction.send,
                        onSubmitted: (_) => _send(),
                        decoration: const InputDecoration(hintText: 'Bir şey sor ya da öneri iste...'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    PressableScale(
                      child: InkWell(
                        borderRadius: BorderRadius.circular(999),
                        onTap: _sending ? null : _send,
                        child: Container(
                          width: 46,
                          height: 46,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: _sending ? EmarColors.espresso.withValues(alpha: 0.3) : EmarColors.paprika,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.arrow_upward, color: EmarColors.surface, size: 20),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _ChatBubble extends StatelessWidget {
  final ChatTurn turn;
  const _ChatBubble({required this.turn});

  @override
  Widget build(BuildContext context) {
    final mine = turn.fromUser;
    return Align(
      alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.76),
        decoration: BoxDecoration(
          color: mine ? EmarColors.paprika : EmarColors.surface,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(mine ? 16 : 4),
            bottomRight: Radius.circular(mine ? 4 : 16),
          ),
          border: mine ? null : Border.all(color: EmarColors.espresso.withValues(alpha: 0.08)),
        ),
        child: Text(
          turn.text,
          style: TextStyle(color: mine ? EmarColors.surface : EmarColors.espresso, fontSize: 13.5, height: 1.4),
        ),
      ),
    );
  }
}

class _TypingBubble extends StatefulWidget {
  const _TypingBubble();

  @override
  State<_TypingBubble> createState() => _TypingBubbleState();
}

class _TypingBubbleState extends State<_TypingBubble> with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1000))..repeat();

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: EmarColors.surface,
          borderRadius: const BorderRadius.only(topLeft: Radius.circular(16), topRight: Radius.circular(16), bottomRight: Radius.circular(16)),
          border: Border.all(color: EmarColors.espresso.withValues(alpha: 0.08)),
        ),
        child: AnimatedBuilder(
          animation: _ctrl,
          builder: (context, _) {
            return Row(
              mainAxisSize: MainAxisSize.min,
              children: List.generate(3, (i) {
                final t = (_ctrl.value - i * 0.2) % 1.0;
                final scale = 0.6 + 0.4 * (t < 0.5 ? t * 2 : (1 - t) * 2);
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 2),
                  child: Transform.scale(
                    scale: scale.clamp(0.6, 1.0),
                    child: Container(width: 6, height: 6, decoration: const BoxDecoration(color: EmarColors.espresso, shape: BoxShape.circle)),
                  ),
                );
              }),
            );
          },
        ),
      ),
    );
  }
}

class _MissingKeyNotice extends StatelessWidget {
  final VoidCallback onBack;
  const _MissingKeyNotice({required this.onBack});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(28),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.cloud_off_outlined, size: 40, color: EmarColors.espresso),
          const SizedBox(height: 16),
          Text('Supabase bağlantısı tanımlı değil', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 17)),
          const SizedBox(height: 10),
          Text(
            'Asistan, Supabase Edge Function üzerinden çalışıyor. Model API anahtarı sunucuda '
            'durur; uygulamaya sadece proje adresi ve anon key verilir.',
            style: TextStyle(fontSize: 13, color: EmarColors.espresso.withValues(alpha: 0.7), height: 1.5),
          ),
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: EmarColors.oatDark, borderRadius: BorderRadius.circular(12)),
            child: const SelectableText(
              'flutter run -d web-server --web-port=8765 \\\n'
              '  --dart-define=SUPABASE_URL=https://xxxx.supabase.co \\\n'
              '  --dart-define=SUPABASE_ANON_KEY=eyJ...',
              style: TextStyle(fontFamily: 'monospace', fontSize: 12, color: EmarColors.espresso),
            ),
          ),
        ],
      ),
    );
  }
}
