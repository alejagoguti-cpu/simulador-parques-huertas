"""Revisa la secuencia del giro: claves de la cámara, resolución de ticks y corte de cámara."""
import unreal
seq = unreal.load_asset('/Game/Kennedy/Giro')
out = ['display %s tick %s rango %s-%s' % (seq.get_display_rate(), seq.get_tick_resolution(), seq.get_playback_start(), seq.get_playback_end())]
for b in seq.get_bindings():
    out.append('binding %s' % b.get_display_name())
    for tr in b.get_tracks():
        for s in tr.get_sections():
            out.append('  track %s rango %s-%s' % (tr.get_class().get_name(), s.get_start_frame(), s.get_end_frame()))
            for ch in s.get_all_channels()[:6]:
                ks = ch.get_keys()
                out.append('    %s: %d claves; %s' % (ch.get_name(), len(ks), [(k.get_time().frame_number.value, round(k.get_value(), 1)) for k in ks[:3]] + ['...'] + [(k.get_time().frame_number.value, round(k.get_value(), 1)) for k in ks[-2:]]))
for tr in seq.get_tracks():
    out.append('track maestro %s' % tr.get_class().get_name())
with open(r'C:\Users\ACER\Documents\Unreal Projects\Kennedy360\Saved\revisar_giro.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(out))
