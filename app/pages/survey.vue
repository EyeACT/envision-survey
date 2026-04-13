<script setup lang="ts">
definePageMeta({ middleware: ["auth"] });
useSeoMeta({ title: "Survey" });

const route = useRoute();
const toast = process.client ? useToast() : null;

// Fetch data
const { data, error, refresh } = await useFetch("/api/dataset", {
  default: () => ({ datasets: [], evaluations: {} }),
});

if (error.value && process.client) {
  toast?.add({ title: "Failed to load datasets", color: "red" });
}

const datasets = computed(() => data.value?.datasets ?? []);
const evaluations = computed(() => data.value?.evaluations ?? {});
const total = computed(() => datasets.value.length);

const index = computed(() => {
  const i = Number(route.query?.index ?? 0);
  return isNaN(i) ? 0 : Math.max(0, Math.min(i, Math.max(0, total.value - 1)));
});

const dataset = computed(() => datasets.value[index.value] ?? null);

// Normalize data keys (Mapping DB camelCase to Template snake_case)
const normalizedDataset = computed(() => {
  if (!dataset.value) return null;
  return {
    ...dataset.value,
    author_affiliation: dataset.value.authorAffiliation || "Unknown",
    source: dataset.value.sourceReposityId || "Unknown",
    keywords: Array.isArray(dataset.value.keywords) ? dataset.value.keywords : [],
    fileExtensions: Array.isArray(dataset.value.fileExtensions) ? dataset.value.fileExtensions : [],
  };
});

const progress = computed(() =>
  total.value > 0 ? Math.round(((index.value + 1) / total.value) * 100) : 0
);

const confidence = ref<number | null>(null);
const comment = ref("");
const submitting = ref(false);
const canSubmit = computed(() => confidence.value !== null);

// Load existing evaluation if user navigates back
watch(dataset, (newVal) => {
  if (!newVal) return;
  const existing = evaluations.value[newVal.id];
  confidence.value = existing?.confidence ?? null;
  comment.value = existing?.comment ?? "";
}, { immediate: true });

const submitAndNavigate = async (nextIndex: number) => {
  if (!dataset.value || confidence.value === null) return;
  submitting.value = true;

  try {
    await $fetch("/api/evaluation", {
      method: "POST",
      body: {
        datasetId: dataset.value.id,
        confidence: confidence.value,
        comment: comment.value || null,
        // Crucial fix: provide the label the backend expects
        label: confidence.value >= 3 ? "eye-imaging" : "non-eye-imaging"
      },
    });

    if (nextIndex >= total.value) {
      await navigateTo("/complete");
    } else {
      confidence.value = null;
      comment.value = "";
      await navigateTo({ query: { index: nextIndex } });
    }
  } catch (err) {
    toast?.add({ title: "Failed to save", color: "red" });
  } finally {
    submitting.value = false;
  }
};

const goNext = () => submitAndNavigate(index.value + 1);

const isFinished = computed(() => data.value?.isFinished || (data.value?.datasets.length === 0 && !submitting.value));

watchEffect(() => {
  if (isFinished.value && data.value) {
    navigateTo("/complete");
  }
});
</script>

<template>
  <div class="min-h-screen bg-white font-sans antialiased text-slate-900">
    <header class="border-b border-slate-200 bg-white px-8 py-6">
      <div class="mx-auto max-w-[1600px] flex items-center justify-between">
        <div class="flex items-center gap-6">
          <div class="h-12 w-12 flex items-center justify-center rounded-lg bg-[#00897b] text-white text-xl font-bold">
            {{ index + 1 }}
          </div>
          <div>
            <h1 class="text-sm font-bold uppercase tracking-wider text-slate-500">Record Review</h1>
            <p class="text-xs text-slate-400">Record ID: #{{ normalizedDataset?.id }}</p>
          </div>
        </div>
        <div class="flex flex-col items-end gap-2">
          <div class="flex gap-10 text-xs text-slate-400 font-bold">
            <span>Progress</span>
            <span>{{ progress }}%</span>
          </div>
          <div class="w-80 h-2 bg-slate-100 rounded-full">
            <div class="h-full bg-[#00897b] transition-all" :style="{ width: `${progress}%` }"></div>
          </div>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-[1600px] px-8 py-12">
      <div v-if="normalizedDataset" class="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        <div class="lg:col-span-7 border border-slate-200 rounded-2xl p-10 shadow-sm">
          <div class="space-y-10">
            <section>
              <div class="flex items-center gap-2 text-xs font-bold text-[#00897b] uppercase tracking-wider mb-3">
                Title
              </div>
              <h2 class="text-3xl font-bold text-slate-800 leading-tight">{{ normalizedDataset.title }}</h2>
            </section>

            <section>
              <div class="flex items-center gap-2 text-xs font-bold text-[#00897b] uppercase tracking-wider mb-3">
                Description
              </div>
              <div class="text-lg font-medium text-slate-700">
                {{ normalizedDataset.description }}
              </div>
            </section>

            <div class="grid grid-cols-2 gap-8">
              <section>
                <div class="flex items-center gap-2 text-xs font-bold text-[#00897b] uppercase tracking-wider mb-3">
                  Keywords / Tags
                </div>
                <div class="text-lg font-medium text-slate-700">
                  {{ normalizedDataset.keywords.join(', ') }}
                </div>
              </section>
              <section>
                <div class="flex items-center gap-2 text-xs font-bold text-[#00897b] uppercase tracking-wider mb-3">
                  File Extensions
                </div>
                <div class="text-lg font-medium text-slate-700">
                  {{ normalizedDataset.fileExtensions.join('  ') }}
                </div>
              </section>
            </div>

            <section>
              <div class="flex items-center gap-2 text-xs font-bold text-[#00897b] uppercase tracking-wider mb-2">
                Source Repository
              </div>
              <p class="text-lg font-medium text-slate-700">{{ normalizedDataset.source }}</p>
            </section>

            <section>
              <div class="flex items-center gap-2 text-xs font-bold text-[#00897b] uppercase tracking-wider mb-2">
                Author's Affiliation
              </div>
              <p class="text-lg font-medium text-slate-700">{{ normalizedDataset.author_affiliation }}</p>
            </section>

            <section>
              <div class="flex items-center gap-2 text-xs font-bold text-[#00897b] uppercase tracking-wider mb-3">
                Record URL
              </div>
              <a :href="normalizedDataset.url" 
                target="_blank" 
                class="text-sm text-[#00a2ed] font-bold hover:underline flex items-start gap-2 break-all"
              >
                <UIcon name="i-heroicons-link" class="w-5 h-5 shrink-0 mt-0.5" />
                <span>{{ normalizedDataset.url }}</span>
              </a>
            </section>
          </div>
        </div>

        <div class="lg:col-span-5 border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div class="p-10 flex-1 space-y-10">
            <h3 class="text-2xl font-bold text-slate-800">Scoring Per Record</h3>
            
            <div class="space-y-8">
              <div>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">Score 0-5: negative to eye_imaging</p>
                <div class="flex gap-3">
                  <button v-for="n in [5,4,3,2,1,0]" :key="n"
                    @click="confidence = n"
                    :class="[
                      'flex-1 h-16 rounded-lg text-xl font-black transition-all border-2',
                      confidence === n ? 'border-black ring-2 ring-black/10' : 'border-transparent',
                      n >= 3 ? (confidence === n ? 'bg-[#00897b] text-white' : 'bg-[#e0f2f1] text-[#00897b]') 
                             : (confidence === n ? 'bg-[#c62828] text-white' : 'bg-[#ffebee] text-[#c62828]')
                    ]"
                  >
                    {{ n }}
                  </button>
                </div>
              </div>

              <div :class="[
                'p-6 rounded-xl border text-lg transition-colors min-h-[100px] flex items-center justify-center',
                confidence === null ? 'bg-slate-50 border-slate-100 text-slate-400' : 
                confidence >= 3 ? 'bg-[#e0f2f1] border-[#b2dfdb] text-[#004d40]' : 'bg-[#ffebee] border-[#ffcdd2] text-[#b71c1c]'
              ]">
                <div v-if="confidence !== null" class="w-full">
                  <p class="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">Guideline</p>
                  <p class="font-bold leading-tight">
                    {{ 
                      confidence === 5 ? 'Certain Eye Imaging: Unambiguous ophthalmic imaging dataset' : 
                      confidence === 4 ? 'Likely Eye Imaging: Strong evidence of eye imaging, minor doubt' : 
                      confidence === 3 ? 'Possible Eye Imaging: Reasonable but uncertain' :
                      confidence === 2 ? 'Unlikely Eye Imaging: Significant doubt, sparse metadata' :
                      confidence === 1 ? 'Likely Not Related: Probably not eye imaging' :
                      'Certain Not Related: Clearly not related to eye imaging'
                    }}
                  </p>
                </div>
                <p v-else class="text-sm font-bold text-center uppercase tracking-widest">Select a score</p>
              </div>

              <div>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 text-left">OPTIONAL COMMENT</p>
                <UTextarea v-model="comment" placeholder="Add any comments here..." class="w-full text-lg" :rows="4" />
              </div>
            </div>
          </div>

          <div class="border-t border-slate-200 flex h-20">
            <button @click="goNext" :disabled="!canSubmit" class="flex-1 font-bold text-xl text-slate-700 hover:bg-slate-50 disabled:opacity-30 transition-colors">
              Submit & Next
            </button>
          </div>
        </div>

      </div>
    </main>
  </div>
</template>