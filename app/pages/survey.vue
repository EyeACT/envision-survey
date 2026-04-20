<script setup lang="ts">
definePageMeta({ middleware: ["auth"] });
useSeoMeta({ title: "Survey" });

const route = useRoute();
const toast = process.client ? useToast() : null;

const cleanKeywords = (rawKeywords: any): string[] => {
  if (!rawKeywords) return [];
  
  // 1. Convert to string and fix those broken HTML entities
  let text = String(rawKeywords)
    .replace(/&#\s*\d+\s*;?/g, '') 
    .replace(/[<>]/g, '');         

  // 2. Split by commas
  return text.split(',')
    .map(k => k.trim())
    .filter(k => {
      if (/^\d+$/.test(k)) return false;
      
      const noise = ['test whether', 'differences', 'participants', 'control'];
      if (noise.some(word => k.toLowerCase().includes(word))) return false;
      
      return k.length > 2;
    });
};

// --- Data Fetching ---
const { data, refresh } = await useFetch("/api/dataset", {
  default: () => ({ datasets: [], evaluations: {}, total: 0 }),
  onResponse({ response }) {
    // Only auto-jump if the user just arrived (no index in URL)
    if (!route.query.index && response._data?.datasets) {
      const datasets = response._data.datasets;
      const evals = response._data.evaluations;

      // Find the first index where no evaluation exists
      const firstPendingIndex = datasets.findIndex(d => !evals[d.id]);

      // If they finished everything, stay at 0 or go to a complete page
      // Otherwise, jump to their current pending task
      if (firstPendingIndex !== -1 && firstPendingIndex !== 0) {
        navigateTo({ query: { index: firstPendingIndex } });
      }
    }
  }
});

const datasets = computed(() => data.value?.datasets ?? []);
const evaluations = computed(() => data.value?.evaluations ?? {});
const total = computed(() => datasets.value.length);

const index = computed(() => {
  const i = Number(route.query?.index ?? 0);
  return isNaN(i) ? 0 : Math.max(0, Math.min(i, Math.max(0, total.value - 1)));
});

const dataset = computed(() => datasets.value[index.value] ?? null);

const normalizedDataset = computed(() => {
  if (!dataset.value) return null;
  return {
    ...dataset.value,
    keywords: cleanKeywords(dataset.value.keywords),
    fileExtensions: Array.isArray(dataset.value.fileExtensions) ? dataset.value.fileExtensions : [],
  };
});

const progress = computed(() =>
  total.value > 0 ? Math.round(((index.value + 1) / total.value) * 100) : 0
);

const confidence = ref<"yes" | "no" | "maybe" | null>(null);
const comment = ref("");
const submitting = ref(false);
const canSubmit = computed(() => confidence.value !== null);

watch(dataset, (newVal) => {
  if (!newVal) return;

  const existing = evaluations.value[newVal.id];
  
  if (existing) {
    // Match the scores from your scoreMapping
    if (existing.confidence === 5) confidence.value = 'yes';
    else if (existing.confidence === 0) confidence.value = 'no';
    else if (existing.confidence === 3) confidence.value = 'maybe';
    
    comment.value = existing.comment ?? "";
  } else {
    // It's a brand new record, clear the form
    confidence.value = null;
    comment.value = "";
  }
}, { immediate: true });

const goBack = async () => {
  if (index.value > 0) {
    await navigateTo({ query: { index: index.value - 1 } });
  }
};

const submitAndNavigate = async (nextIndex: number) => {
  if (!dataset.value || confidence.value === null) return;
  submitting.value = true;

  const currentId = dataset.value.id;
  const currentConfidence = confidence.value;
  const currentComment = comment.value;

  const scoreMapping = {
    yes: { score: 5, label: "eye-imaging" },
    no: { score: 0, label: "non-eye-imaging" },
    maybe: { score: 3, label: "possible-eye-imaging" }
  };

  try {
    const score = scoreMapping[currentConfidence].score;
    const label = scoreMapping[currentConfidence].label;

    await $fetch("/api/evaluation", {
      method: "POST",
      body: {
        datasetId: currentId,
        confidence: score,
        comment: currentComment || null,
        label: label
      },
    });

    // --- THE FIX: MANUALLY UPDATE LOCAL STATE ---
    // This ensures that when you go back, the UI finds this record in the map
    if (data.value?.evaluations) {
      data.value.evaluations[currentId] = {
        datasetId: currentId,
        confidence: score,
        label: label,
        comment: currentComment
      };
    }

    // Still call refresh to keep the server and progress bar in sync
    await refresh();

    if (nextIndex >= total.value) {
      await navigateTo("/complete");
    } else {
      await navigateTo({ query: { index: nextIndex } });
    }
  } catch (err) {
    toast?.add({ title: "Failed to save", color: "red" });
  } finally {
    submitting.value = false;
  }
};
const goNext = () => submitAndNavigate(index.value + 1);
</script>

<template>
  <div class="min-h-screen bg-white font-sans antialiased text-slate-900">
    <header class="border-b border-slate-200 bg-white px-6 py-3 sticky top-0 z-30">
      <div class="mx-auto max-w-[1400px] flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="h-9 w-9 flex items-center justify-center rounded bg-[#00897b] text-white font-bold text-sm">
            {{ index + 1 }}
          </div>
          <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Record Review #{{ normalizedDataset?.id }}</p>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Progress: {{ progress }}%</span>
          <div class="w-40 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div class="h-full bg-[#00897b] transition-all" :style="{ width: `${progress}%` }"></div>
          </div>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-[1400px] px-6 py-6">
      <div class="mb-6 px-5 py-4 border border-slate-200 rounded-xl bg-slate-50/50 flex items-start gap-4 shadow-sm">
        <UIcon name="i-heroicons-shield-check" class="w-5 h-5 text-[#00897b] mt-0.5 shrink-0" />
        <div class="text-[13px] leading-relaxed text-slate-600">
          Please review the Dataset details on the left. 
          Complete the Evaluation on the right. 
          Select "Submit & Next" to save the record and advance.
        </div>
      </div>

      <div v-if="normalizedDataset" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        <div class="lg:col-span-8 border border-slate-200 rounded-xl p-8 shadow-sm flex flex-col bg-white">
          <div class="flex-1 space-y-8">
            <section v-if="normalizedDataset.title">
              <div class="text-[10px] font-bold text-[#00897b] uppercase tracking-widest mb-1.5">Title</div>
              <h2 class="text-2xl font-bold text-slate-800 leading-tight tracking-tight">{{ normalizedDataset.title }}</h2>
            </section>

            <section v-if="normalizedDataset.description">
              <div class="text-[10px] font-bold text-[#00897b] uppercase tracking-widest mb-1.5">Description</div>
              <div class="text-[15px] text-slate-700 leading-relaxed">{{ normalizedDataset.description }}</div>
            </section>

            <div class="grid grid-cols-2 gap-8 pt-4 border-t border-slate-100">
              <section v-if="normalizedDataset.keywords?.length">
                <div class="text-[10px] font-bold text-[#00897b] uppercase tracking-widest mb-1.5">Identifiers / Keywords</div>
                <div class="text-sm text-slate-600">{{ normalizedDataset.keywords.join(', ') }}</div>
              </section>

              <section v-if="normalizedDataset.fileExtensions?.length">
                <div class="text-[10px] font-bold text-[#00897b] uppercase tracking-widest mb-1.5">File Types</div>
                <div class="text-sm font-mono text-slate-500">{{ normalizedDataset.fileExtensions.join(', ') }}</div>
              </section>
            </div>
          </div>

          <section v-if="normalizedDataset.source && normalizedDataset.source !== 'Unknown'" class="mt-8 pt-4 border-t border-slate-50">
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Source Repository</div>
            <p class="text-sm font-medium text-slate-600">{{ normalizedDataset.source }}</p>
          </section>
        </div>

        <div class="lg:col-span-4 border border-slate-200 rounded-xl shadow-sm bg-white overflow-hidden flex flex-col">
          <div class="p-8 flex-1 flex flex-col">
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-widest mb-6">Evaluation</h3>
            
            <div class="flex flex-col gap-2.5 mb-8">
              <button @click="confidence = 'yes'"
                :class="[
                  'flex items-center justify-between px-4 py-3.5 rounded-lg border transition-all',
                  confidence === 'yes' ? 'border-[#00897b] bg-[#e0f2f1] text-[#00897b] ring-1 ring-[#00897b]' : 'border-slate-200 hover:border-slate-300'
                ]">
                <span class="font-bold text-sm uppercase tracking-wide">Yes</span>
                <span class="text-[10px] opacity-60 font-semibold italic">This is eye imaging data</span>
              </button>

              <button @click="confidence = 'no'"
                :class="[
                  'flex items-center justify-between px-4 py-3.5 rounded-lg border transition-all',
                  confidence === 'no' ? 'border-[#c62828] bg-[#ffebee] text-[#c62828] ring-1 ring-[#c62828]' : 'border-slate-200 hover:border-slate-300'
                ]">
                <span class="font-bold text-sm uppercase tracking-wide">No</span>
                <span class="text-[10px] opacity-60 font-semibold italic">This is not eye imaging data</span>
              </button>

              <button @click="confidence = 'maybe'"
                :class="[
                  'flex items-center justify-between px-4 py-3.5 rounded-lg border transition-all',
                  confidence === 'maybe' ? 'border-slate-800 bg-slate-100 text-slate-800 ring-1 ring-slate-800' : 'border-slate-200 hover:border-slate-300'
                ]">
                <span class="font-bold text-sm uppercase tracking-wide">I cannot tell</span>
                <span class="text-[10px] opacity-60 font-semibold italic">Metadata is insufficient to determine</span>
              </button>
            </div>

            <div class="mt-auto">
              <div class="text-[10px] font-bold text-[#00897b] uppercase tracking-widest mb-2">Optional Comments</div>
              <UTextarea v-model="comment" placeholder="" :rows="4" class="w-full" />
            </div>
          </div>

          <div class="p-8 pt-0 mt-auto flex gap-3">
            <button 
              v-if="index > 0"
              type="button"
              @click="goBack" 
              :disabled="submitting"
              class="flex-1 py-4 rounded-lg font-bold text-sm uppercase tracking-widest border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all disabled:opacity-30"
            >
              Back
            </button>

            <button 
              type="button"
              @click="goNext" 
              :disabled="!canSubmit || submitting" 
              class="flex-[2] py-4 rounded-lg font-bold text-sm uppercase tracking-widest transition-all shadow-sm disabled:opacity-30"
              :class="canSubmit 
                ? 'bg-[#00897b] text-white hover:bg-[#00796b]' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'"
            >
              <span v-if="submitting">Processing...</span>
              <span v-else>Submit & Next</span>
            </button>
          </div>
        </div>

      </div>
    </main>
  </div>
</template>