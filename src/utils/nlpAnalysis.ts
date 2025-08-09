export const detectAbsolutismsNLP = (nlp, text) => {
    if (!nlp) return [];
    
    try {
      const doc = nlp.readDoc(text);
      const absolutisms = [];
      
      // Detect superlatives (JJS, RBS tags)
      doc.tokens().each(token => {
        const pos = token.out(nlp.its.pos);
        const lemma = token.out(nlp.its.lemma).toLowerCase();
        const word = token.out().toLowerCase();
        
        // Superlative adjectives and adverbs
        if (pos === 'JJS' || pos === 'RBS') {
          absolutisms.push({
            text: token.out(),
            start: token.out(nlp.its.offset),
            type: 'superlative'
          });
        }
        
        // Absolute quantifiers and temporal expressions
        const absoluteWords = [
          'never', 'always', 'forever', 'eternal', 'infinite', 'absolute',
          'complete', 'total', 'entire', 'whole', 'all', 'every', 'none',
          'nothing', 'everything', 'everyone', 'nobody', 'anywhere',
          'everywhere', 'nowhere', 'perfect', 'impossible', 'ultimate'
        ];
        
        if (absoluteWords.includes(lemma) || absoluteWords.includes(word)) {
          absolutisms.push({
            text: token.out(),
            start: token.out(nlp.its.offset),
            type: 'absolute_word'
          });
        }
        
        // Extreme intensifiers
        const intensifiers = ['extremely', 'incredibly', 'unbelievably', 'remarkably', 
                            'exceptionally', 'extraordinarily', 'tremendously', 'vastly'];
        if (intensifiers.includes(lemma)) {
          absolutisms.push({
            text: token.out(),
            start: token.out(nlp.its.offset),
            type: 'intensifier'
          });
        }
      });
      
      // Detect phrases with "most", "least", "far more", etc.
      const sentences = doc.sentences();
      sentences.each(sentence => {
        const sentenceText = sentence.out();
        const absolutePatterns = [
          /\b(?:far|much|way)\s+(?:more|less|better|worse|bigger|smaller)\b/gi,
          /\b(?:the\s+)?most\s+\w+/gi,
          /\b(?:the\s+)?least\s+\w+/gi,
          /\bof\s+all\s+time\b/gi,
          /\bin\s+history\b/gi,
          /\bever\s+(?:seen|heard|known|told|made)\b/gi
        ];
        
        absolutePatterns.forEach(pattern => {
          let match;
          while ((match = pattern.exec(sentenceText)) !== null) {
            absolutisms.push({
              text: match[0],
              start: sentence.out(nlp.its.offset) + match.index,
              type: 'phrase'
            });
          }
        });
      });
      
      return absolutisms;
    } catch (error) {
      console.warn('NLP absolutism detection failed:', error);
      return [];
    }
  };
  
  export const detectInversionsNLP = (nlp, text) => {
    if (!nlp) return [];
    
    try {
      const doc = nlp.readDoc(text);
      const inversions = [];
      
      doc.tokens().each(token => {
        const word = token.out().toLowerCase();
        const lemma = token.out(nlp.its.lemma).toLowerCase();
        const pos = token.out(nlp.its.pos);
        
        // Contractions and negations
        const negativeContractions = [
          "don't", "doesn't", "didn't", "won't", "wouldn't", "shouldn't",
          "couldn't", "can't", "isn't", "aren't", "wasn't", "weren't",
          "haven't", "hasn't", "hadn't", "mustn't", "needn't", "shan't"
        ];
        
        if (negativeContractions.includes(word)) {
          inversions.push({
            text: token.out(),
            start: token.out(nlp.its.offset),
            type: 'contraction'
          });
        }
        
        // Explicit negation words
        if (lemma === 'not' || word === 'no' || lemma === 'never') {
          inversions.push({
            text: token.out(),
            start: token.out(nlp.its.offset),
            type: 'negation'
          });
        }
        
        // Negative prefixes on adjectives and verbs
        if ((pos.startsWith('JJ') || pos.startsWith('VB')) && 
            (word.startsWith('un') || word.startsWith('dis') || 
             word.startsWith('in') || word.startsWith('im') ||
             word.startsWith('non') || word.startsWith('anti'))) {
          inversions.push({
            text: token.out(),
            start: token.out(nlp.its.offset),
            type: 'negative_prefix'
          });
        }
      });
      
      // Detect inversion phrases
      const sentences = doc.sentences();
      sentences.each(sentence => {
        const sentenceText = sentence.out();
        const inversionPatterns = [
          /\bnotice what (?:he|she|they|we|you|i) didn't say\b/gi,
          /\b(?:not|never) (?:a|an|the)?\s*(?:single|one)\b/gi,
          /\bfar from (?:being|the|a)\b/gi,
          /\banything but\b/gi,
          /\bcontrary to\b/gi,
          /\bopposite of\b/gi
        ];
        
        inversionPatterns.forEach(pattern => {
          let match;
          while ((match = pattern.exec(sentenceText)) !== null) {
            inversions.push({
              text: match[0],
              start: sentence.out(nlp.its.offset) + match.index,
              type: 'phrase'
            });
          }
        });
      });
      
      return inversions;
    } catch (error) {
      console.warn('NLP inversion detection failed:', error);
      return [];
    }
  };