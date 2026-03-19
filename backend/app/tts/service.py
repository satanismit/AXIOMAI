import os
import uuid
# For coqui-tts, the primary interface is the TTS module
try:
    from TTS.api import TTS
except ImportError:
    TTS = None

def generate_audio(text: str, output_dir: str = "app/static/audio"):
    if not TTS:
        return {"status": "error", "message": "Coqui TTS module not installed or available."}

    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    filename = f"{uuid.uuid4().hex}.wav"
    output_path = os.path.join(output_dir, filename)
    
    try:
        # Using a fast, lightweight local inference model (VITS)
        tts = TTS("tts_models/en/vctk/vits")
        
        # Generating audio to file
        tts.tts_to_file(text=text, speaker="p225", file_path=output_path)
        
        return {
            "status": "success", 
            "audio_url": f"/static/audio/{filename}",
            "local_path": output_path
        }
    except Exception as e:
        return {"status": "error", "message": f"TTS generation failed: {str(e)}"}

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        text = " ".join(sys.argv[1:])
        print("Synthesizing audio...")
        res = generate_audio(text)
        print(res)
    else:
        print("Usage: python service.py '<text to speak>'")
