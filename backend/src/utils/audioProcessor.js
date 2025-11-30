import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Extracts amplitude data from audio file for waveform visualization
 * Uses ffmpeg to analyze the audio and extract amplitude samples
 * Falls back to random waveform if ffmpeg is not available
 * @param {string} filePath - Path to the audio file
 * @param {number} samples - Number of data points to extract (default: 50)
 * @returns {Promise<number[]>} Array of amplitude values
 */
export const extractAudioWaveform = async (filePath, samples = 50) => {
  try {
    // Check if ffmpeg is available
    try {
      await new Promise((resolve, reject) => {
        exec('ffmpeg -version', (error) => {
          if (error) {
            console.log('ffmpeg not found, using fallback waveform generation');
            reject(new Error('ffmpeg not available'));
          } else {
            resolve();
          }
        });
      });
    } catch (error) {
      // ffmpeg not available, generate random waveform
      console.log('Using fallback waveform generation');
      return Array(samples)
        .fill()
        .map(() => Math.random() * 0.5 + 0.3);
    }

    // Create a temporary output file
    const outputFile = path.join(path.dirname(filePath), `${path.basename(filePath)}.json`);

    // Use ffmpeg to extract audio data
    // This command analyzes the audio file and outputs amplitude values
    return new Promise((resolve, reject) => {
      exec(
        `ffmpeg -i "${filePath}" -af "asetnsamples=n=${samples}" -f null - 2>&1 | grep -o "mean_volume:.*" | cut -f 2 -d ":"`,
        (error, stdout) => {
          if (error && error.code !== 1) {
            console.error('Error extracting waveform data:', error);
            // Return dummy data if extraction fails
            return resolve(Array(samples).fill(0.5));
          }

          try {
            // Parse the output and convert to normalized values
            const values = stdout
              .trim()
              .split('\n')
              .map((line) => {
                const value = parseFloat(line);
                // Normalize between 0 and 1
                return isNaN(value) ? 0.5 : Math.min(Math.max((value + 30) / 30, 0), 1);
              });

            // If we got fewer samples than requested, fill the rest
            const result =
              values.length < samples
                ? [...values, ...Array(samples - values.length).fill(0.5)]
                : values.slice(0, samples);

            resolve(result);
          } catch (parseError) {
            console.error('Error parsing waveform data:', parseError);
            resolve(Array(samples).fill(0.5));
          }
        }
      );
    });
  } catch (error) {
    console.error('Error in extractAudioWaveform:', error);
    // Return default data on error
    return Array(samples).fill(0.5);
  }
};
