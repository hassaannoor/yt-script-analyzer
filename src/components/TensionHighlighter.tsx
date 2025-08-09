import React, { useState, useCallback, useMemo } from 'react';
import { useNLP } from '../hooks/useNLP';
import { detectAbsolutismsNLP, detectInversionsNLP } from '../utils/nlpAnalysis';
import { TENSION_PATTERNS } from '../utils/tensionPatterns';

const TensionHighlighter = () => {
  const [inputText, setInputText] = useState('');
  const [highlightedText, setHighlightedText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    tension: 0,
    absolutism: 0,
    inversion: 0
  });

  const { nlp, isLoaded: isNlpLoaded, error: nlpError } = useNLP();

  const escapeHtml = useCallback((text) => {
    return text.replace(/&/g, "&amp;")
               .replace(/</g, "&lt;")
               .replace(/>/g, "&gt;");
  }, []);

  const findTensionPhrases = useCallback((text) => {
    const matches = [];
    TENSION_PATTERNS.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        matches.push({
          text: match[0],
          start: match.index,
          end: match.index + match[0].length,
          type: 'tension'
        });
      }
    });
    return matches;
  }, []);

  const analyzeText = useCallback(async () => {
    if (!inputText.trim()) {
      setHighlightedText('<p class="text-gray-500">Please enter some text to analyze.</p>');
      setStats({ total: 0, tension: 0, absolutism: 0, inversion: 0 });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      let processedText = escapeHtml(inputText);
      const allMatches = new Set();
      const highlights = [];
      
      let tensionCount = 0;
      let absolutismCount = 0;
      let inversionCount = 0;

      // Find tension phrases
      const tensionMatches = findTensionPhrases(inputText);
      tensionMatches.forEach(match => {
        highlights.push({
          ...match,
          class: 'highlight-tension'
        });
        allMatches.add(match.text.toLowerCase());
        tensionCount++;
      });

      // Find absolutisms using NLP
      if (isNlpLoaded && nlp) {
        const absolutisms = detectAbsolutismsNLP(nlp, inputText);
        absolutisms.forEach(abs => {
          highlights.push({
            text: abs.text,
            start: abs.start,
            end: abs.start + abs.text.length,
            type: 'absolutism',
            class: 'highlight-absolutism'
          });
          allMatches.add(abs.text.toLowerCase());
          absolutismCount++;
        });

        // Find inversions using NLP
        const inversions = detectInversionsNLP(nlp, inputText);
        inversions.forEach(inv => {
          highlights.push({
            text: inv.text,
            start: inv.start,
            end: inv.start + inv.text.length,
            type: 'inversion',
            class: 'highlight-inversion'
          });
          allMatches.add(inv.text.toLowerCase());
          inversionCount++;
        });
      }

      // Sort highlights by position (forward order, then reverse for processing)
    highlights.sort((a, b) => a.start - b.start);

    // Remove overlapping highlights (keep the first one found)
    const filteredHighlights = [];
    for (const highlight of highlights) {
    const isOverlapping = filteredHighlights.some(existing => 
        (highlight.start >= existing.start && highlight.start < existing.end) ||
        (highlight.end > existing.start && highlight.end <= existing.end)
    );
    if (!isOverlapping) {
        filteredHighlights.push(highlight);
    }
    }

    // Sort again in reverse order for processing from end to beginning
    filteredHighlights.sort((a, b) => b.start - a.start);

    // Apply highlights (no offset needed since we go backwards)
    filteredHighlights.forEach(highlight => {
    const before = processedText.substring(0, highlight.start);
    const highlighted = `<span class="${highlight.class}">${highlight.text}</span>`;
    const after = processedText.substring(highlight.end);
    processedText = before + highlighted + after;
    });

      setHighlightedText(processedText.replace(/\n/g, '<br>'));
      setStats({
        total: allMatches.size,
        tension: tensionCount,
        absolutism: absolutismCount,
        inversion: inversionCount
      });

    } catch (error) {
      console.error('Analysis failed:', error);
      setHighlightedText('<p class="text-red-500">Analysis failed. Please try again.</p>');
      setStats({ total: 0, tension: 0, absolutism: 0, inversion: 0 });
    } finally {
      setIsAnalyzing(false);
    }
  }, [inputText, nlp, isNlpLoaded, escapeHtml, findTensionPhrases]);

  const nlpStatus = useMemo(() => {
    if (nlpError) return 'NLP Error';
    if (isNlpLoaded) return 'NLP Ready';
    return 'Loading NLP...';
  }, [isNlpLoaded, nlpError]);

  return (
    <div className="bg-gray-100 text-gray-800 min-h-screen p-4 font-inter">
      <div className="w-full max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-center">
            Enhanced Tension-Building Phrase Highlighter
          </h1>
          <p className="text-center text-gray-600 mt-2">
            Advanced NLP-powered analysis to detect tension-building phrases, absolutisms, and inversions.
          </p>
          <div className="text-center mt-2">
            <span className={`text-xs px-2 py-1 rounded-full ${
              isNlpLoaded ? 'bg-green-100 text-green-800' : 
              nlpError ? 'bg-red-100 text-red-800' : 
              'bg-yellow-100 text-yellow-800'
            }`}>
              {nlpStatus}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label htmlFor="inputText" className="text-lg font-semibold text-gray-700">
              Your Text
            </label>
            <textarea
              id="inputText"
              rows={15}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 resize-none"
              placeholder="Paste the transcript or any text here..."
            />
            <button
              onClick={analyzeText}
              disabled={isAnalyzing}
              className={`w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 flex items-center justify-center gap-2 ${
                isAnalyzing ? 'loading' : ''
              }`}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-5 w-5 ${isAnalyzing ? 'spinner' : ''}`} 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              <span>{isAnalyzing ? 'Analyzing...' : 'Analyze and Highlight'}</span>
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-lg font-semibold text-gray-700">
                Highlighted Result
              </label>
              <div className="text-sm font-medium bg-indigo-100 text-indigo-800 py-1 px-3 rounded-full">
                {stats.total} phrase{stats.total !== 1 ? 's' : ''} found
              </div>
            </div>
            <div 
              className="w-full p-4 border border-gray-200 rounded-lg bg-gray-50 overflow-y-auto"
              style={{ minHeight: '300px', maxHeight: '400px' }}
              dangerouslySetInnerHTML={{ 
                __html: highlightedText || '<p class="text-gray-500">Your highlighted text will appear here...</p>' 
              }}
            />
            
            {/* Statistics Panel */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                <div className="text-xs text-yellow-600 font-medium uppercase">Tension</div>
                <div className="text-lg font-bold text-yellow-800">{stats.tension}</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                <div className="text-xs text-blue-600 font-medium uppercase">Absolutism</div>
                <div className="text-lg font-bold text-blue-800">{stats.absolutism}</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                <div className="text-xs text-red-600 font-medium uppercase">Inversion</div>
                <div className="text-lg font-bold text-red-800">{stats.inversion}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">How It Works</h3>
          <p className="text-gray-600 mb-3">
            This enhanced analyzer combines pattern matching with natural language processing (Wink.js) for more accurate detection:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>
              <strong className="highlight-tension px-2 py-1 rounded text-sm">Tension Phrases:</strong>
              {' '}Reveals, foreshadowing, and dramatic language that builds suspense.
            </li>
            <li>
              <strong className="highlight-absolutism px-2 py-1 rounded text-sm">Absolutisms:</strong>
              {' '}Extreme language detected through POS tagging (superlatives, absolutes like "never", "always").
            </li>
            <li>
              <strong className="highlight-inversion px-2 py-1 rounded text-sm">Inversions:</strong>
              {' '}Negations and contractions identified through grammatical analysis.
            </li>
          </ul>
          <p className="text-sm text-gray-500 mt-3">
            💡 The NLP engine analyzes part-of-speech tags, dependencies, and context for more precise detection than regex alone.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TensionHighlighter;