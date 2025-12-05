(function(){
  function initChoicesOnSelects(){
    if (typeof window.Choices === 'undefined') return;
    // Opt-in only: enhance selects that declare data-choices="true"
    var selects = document.querySelectorAll('select[data-choices="true"]');
    selects.forEach(function(sel){
      // Skip if already initialized
      if (sel.dataset.choicesInitialized === 'true') return;
      // Create Choices instance
      try {
        var instance = new Choices(sel, {
          searchEnabled: true,
          itemSelectText: '',
          shouldSort: false,
          removeItemButton: false,
          position: 'auto',
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
            var opts = Array.prototype.slice.call(sel.options || []).map(function(o){
              return { value: o.value, label: o.text, selected: o.selected, disabled: o.disabled };
            });
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
        var opts = Array.prototype.slice.call(sel.options || []).map(function(o){
          return { value: o.value, label: o.text, selected: o.selected, disabled: o.disabled };
        });
        inst.clearChoices();
        inst.setChoices(opts, 'value', 'label', true);
      } catch (e) {
        console.warn('ChoicesHelper.refresh failed', e);
      }
    }
  };
})();
