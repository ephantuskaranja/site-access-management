(function(){
  function extractPlaceholderAndRemove(sel){
    var label = null;
    var options = Array.prototype.slice.call(sel.options || []);
    options.forEach(function(o){
      if (String(o.value) === ''){
        if (label === null) {
          label = (o.text && o.text.trim()) ? o.text : 'Select an option';
        }
        try { o.remove(); } catch(_){ /* ignore */ }
      }
    });
    return label;
  }

  function uniqueOptionList(sel){
    var seen = Object.create(null);
    var opts = [];
    Array.prototype.slice.call(sel.options || []).forEach(function(o){
      var val = String(o.value);
      if (val === '') {
        // Skip placeholder entries entirely for Choices list
        return;
      }
      if (seen[val]){
        // duplicate value, remove from DOM
        try { o.remove(); } catch(_){ /* ignore */ }
        return;
      }
      seen[val] = true;
      opts.push({ value: val, label: o.text, selected: o.selected, disabled: o.disabled });
    });
    return opts;
  }

  function initChoicesOnSelects(){
    if (typeof window.Choices === 'undefined') return;
    // Opt-in only: enhance selects that declare data-choices="true"
    var selects = document.querySelectorAll('select[data-choices="true"]');
    selects.forEach(function(sel){
      // Skip if already initialized
      if (sel.dataset.choicesInitialized === 'true') return;
      // Extract and remove any placeholder options to avoid duplication
      var placeholderLabel = extractPlaceholderAndRemove(sel);
      // Create Choices instance with explicit placeholder
      try {
        var instance = new Choices(sel, {
          searchEnabled: true,
          itemSelectText: '',
          shouldSort: false,
          removeItemButton: false,
          position: 'auto',
          placeholder: true,
          placeholderValue: placeholderLabel || 'Select an option',
          allowHTML: false,
        });
        sel.dataset.choicesInitialized = 'true';
        sel._choices = instance;

        // Sync Choices when options list changes dynamically without looping
        var observer = new MutationObserver(function(mutations){
          var hasChildChange = mutations.some(function(m){ return m.type === 'childList'; });
          if (!hasChildChange) return;
          if (sel._choicesSyncing) return;
          sel._choicesSyncing = true;
          try {
            // Pause observing during sync to avoid recursive triggers
            observer.disconnect();
            var opts = uniqueOptionList(sel);
            instance.clearChoices();
            instance.setChoices(opts, 'value', 'label', true);
          } catch (e) {
            console.warn('Choices sync failed', e);
          } finally {
            setTimeout(function(){
              try { observer.observe(sel, { childList: true }); } catch(_) {}
              sel._choicesSyncing = false;
            }, 0);
          }
        });
        observer.observe(sel, { childList: true });

        // Initial de-dup and sync
        try {
          var initialOpts = uniqueOptionList(sel);
          instance.clearChoices();
          instance.setChoices(initialOpts, 'value', 'label', true);
        } catch(e){ /* ignore */ }
      } catch (e) {
        console.warn('Choices init failed for select', sel, e);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChoicesOnSelects);
  } else {
    initChoicesOnSelects();
  }

  // Expose a safe manual refresh helper for dynamic option updates
  window.ChoicesHelper = window.ChoicesHelper || {
    refresh: function(sel){
      try {
        if (!sel || !sel._choices) return;
        var inst = sel._choices;
        var opts = uniqueOptionList(sel);
        inst.clearChoices();
        inst.setChoices(opts, 'value', 'label', true);
      } catch (e) {
        console.warn('ChoicesHelper.refresh failed', e);
      }
    }
  };
})();
