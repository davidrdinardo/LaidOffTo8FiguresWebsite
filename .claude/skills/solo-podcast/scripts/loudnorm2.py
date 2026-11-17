"""Two-pass loudness fix for the long-form export. The picture is copied untouched; only the audio is re-encoded.

usage: python3 loudnorm2.py <in.mp4> <out.mp4> [target LUFS, default -14]
Descript publishes the full edit at about -21.6 LUFS with peaks near 0 dBFS (episodes 64 and 65). One pass of ffmpeg's loudnorm
undershoots on such a file (episode 65: -15.6 for a -14 target); measuring first and feeding the numbers back landed at -14.5.
Prints the loudness and peak before and after. Exits 1 when the result is outside target-1.5 .. target+1 LUFS.
"""
import sys, re, json, subprocess
src, out = sys.argv[1], sys.argv[2]
target = float(sys.argv[3]) if len(sys.argv) > 3 else -14.0
base = f'loudnorm=I={target}:TP=-1.5:LRA=11'

def measure(path):
    err = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-vn', '-af', 'ebur128=peak=true', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    tail = err[err.rindex('Summary:'):]
    return float(re.search(r'I:\s+(-?[\d.]+) LUFS', tail).group(1)), float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', tail).group(1))

before = measure(src)
err = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', src, '-vn', '-af', base + ':print_format=json', '-f', 'null', '-'],
                     capture_output=True, text=True).stderr
m = json.loads(err[err.rindex('{'):err.rindex('}') + 1])
af = (f"{base}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
      f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-c:v', 'copy', '-af', af, '-ar', '48000',
                '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', out], check=True)
after = measure(out)
print(f'before {before[0]} LUFS, peak {before[1]} dBFS   after {after[0]} LUFS, peak {after[1]} dBFS   ({out})')
if not target - 1.5 <= after[0] <= target + 1:
    sys.exit(f'loudness {after[0]} LUFS is outside {target - 1.5} .. {target + 1}')
