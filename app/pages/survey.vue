<script setup lang="ts">
definePageMeta({ middleware: ["auth"] });
useSeoMeta({ title: "Survey" });

const route = useRoute();
const toast = process.client ? useToast() : null;

const cleanKeywords = (rawKeywords: any): string[] => {
  if (!rawKeywords) return [];

  let text = String(rawKeywords)
    .replace(/&#\s*\d+\s*;?/g, "")
    .replace(/[<>]/g, "");

  return text
    .split(",")
    .map((k) => k.trim())
    .filter((k) => {
      if (/^\d+$/.test(k)) return false;

      const noise = ["test whether", "differences", "participants", "control"];
      if (noise.some((word) => k.toLowerCase().includes(word))) return false;

      return k.length > 2;
    });
};

const { data, refresh } = await useFetch("/api/dataset", {
  default: () => ({ datasets: [], evaluations: {}, total: 0 }),
  onResponse({ response }) {
    if (!route.query.index && response._data?.datasets) {
      const datasets = response._data.datasets;
      const evals = response._data.evaluations;

      const firstPendingIndex = datasets.findIndex((d) => !evals[d.id]);

      if (firstPendingIndex !== -1 && firstPendingIndex !== 0) {
        navigateTo({ query: { index: firstPendingIndex } });
      }
    }
  },
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
    fileExtensions: Array.isArray(dataset.value.fileExtensions)
      ? dataset.value.fileExtensions
      : [],
  };
});

const progress = computed(() =>
  total.value > 0 ? Math.round(((index.value + 1) / total.value) * 100) : 0,
);

const confidence = ref<"yes" | "no" | "maybe" | null>(null);
const comment = ref("");
const submitting = ref(false);
const canSubmit = computed(() => confidence.value !== null);

watch(
  dataset,
  (newVal) => {
    if (!newVal) return;

    const existing = evaluations.value[newVal.id];

    if (existing) {
      if (existing.confidence === 5) confidence.value = "yes";
      else if (existing.confidence === 0) confidence.value = "no";
      else if (existing.confidence === 3) confidence.value = "maybe";

      comment.value = existing.comment ?? "";
    } else {
      confidence.value = null;
      comment.value = "";
    }
  },
  { immediate: true },
);

const isExpanded = ref(false);
const isTruncated = ref(false);
const descriptionRef = ref<HTMLElement | null>(null);

const updateTruncation = () => {
  if (descriptionRef.value) {
    isTruncated.value =
      descriptionRef.value.scrollHeight > descriptionRef.value.clientHeight;
  }
};

watch(dataset, async () => {
  isExpanded.value = false;
  await nextTick();
  updateTruncation();
});

onMounted(() => {
  updateTruncation();
  window.addEventListener("resize", updateTruncation);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateTruncation);
});

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
    maybe: { score: 3, label: "possible-eye-imaging" },
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
        label: label,
      },
    });

    if (data.value?.evaluations) {
      data.value.evaluations[currentId] = {
        datasetId: currentId,
        confidence: score,
        label: label,
        comment: currentComment,
      };
    }

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
  <div class="min-h-screen bg-white font-sans antialiased dark:bg-gray-900">
    <header
      class="sticky top-0 z-30 border-slate-200 bg-white px-6 py-6 dark:border-gray-700 dark:bg-gray-900"
    >
      <div class="mx-auto flex max-w-[800px] flex-col items-center gap-3">
        <div
          class="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 shadow-sm dark:bg-gray-700"
        >
          <div
            class="h-full bg-[#00897b] transition-all duration-500 ease-out"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>

        <div class="flex w-full items-center justify-between px-1">
          <div class="flex items-center gap-1.5">
            <span class="text-[12px] font-black tracking-tight">
              {{ index + 1 }}
            </span>
            <span class="text-[10px] font-bold tracking-widest uppercase">
              / {{ total }} Records
            </span>
          </div>

          <span
            class="text-[10px] font-black tracking-widest text-[#00897b] uppercase"
          >
            {{ progress }}% Complete
          </span>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-[1400px] px-6">
      <div
        class="mb-6 flex items-start gap-4 rounded-xl border border-slate-200 bg-slate-50/50 px-5 py-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <UIcon
          name="material-symbols:info-outline-rounded"
          class="mt-0.5 h-5 w-5 shrink-0 text-[#00897b]"
        />
        <div class="text-[13px] leading-relaxed">
          Please review the Dataset details on the left, then complete the
          Evaluation on the right. Select "Submit & Next" to save the record and
          advance.
        </div>
      </div>

      <div
        v-if="normalizedDataset"
        class="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12"
      >
        <div
          class="flex flex-col rounded-xl border border-slate-200 p-8 shadow-sm lg:col-span-8 dark:border-gray-700 dark:bg-gray-800"
        >
          <div class="flex-1 space-y-8">
            <section v-if="normalizedDataset.title">
              <div
                class="mb-1.5 text-[10px] font-bold tracking-widest text-[#00897b] uppercase"
              >
                Title
              </div>
              <h2 class="text-lg leading-tight font-semibold tracking-tight">
                {{ normalizedDataset.title }}
              </h2>
            </section>

            <section v-if="normalizedDataset.description">
              <div
                class="mb-2 text-[10px] font-bold tracking-widest text-[#00897b] uppercase"
              >
                Description
              </div>

              <div
                ref="descriptionRef"
                class="overflow-hidden text-[15px] leading-relaxed transition-all duration-300"
                :class="{ 'line-clamp-5': !isExpanded }"
              >
                {{ normalizedDataset.description }}
              </div>

              <div v-if="isTruncated || isExpanded" class="mt-3">
                <button
                  @click="isExpanded = !isExpanded"
                  class="group flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase transition-all hover:text-[#00897b]"
                >
                  {{ isExpanded ? "Show Less" : "Expand All" }}
                  <UIcon
                    :name="
                      isExpanded
                        ? 'i-heroicons-chevron-up'
                        : 'i-heroicons-chevron-down'
                    "
                    class="h-3 w-3 transition-transform duration-200 group-hover:translate-y-0.5"
                  />
                </button>
              </div>
            </section>

            <div
              class="grid grid-cols-2 gap-8 border-t border-slate-100 pt-4 dark:border-gray-700"
            >
              <section v-if="normalizedDataset.keywords?.length">
                <div
                  class="mb-1.5 text-[10px] font-bold tracking-widest text-[#00897b] uppercase"
                >
                  Identifiers / Keywords
                </div>
                <div class="text-sm">
                  {{ normalizedDataset.keywords.join(", ") }}
                </div>
              </section>

              <section v-if="normalizedDataset.fileExtensions?.length">
                <div
                  class="mb-1.5 text-[10px] font-bold tracking-widest text-[#00897b] uppercase"
                >
                  File Types
                </div>
                <div class="font-mono text-sm">
                  {{ normalizedDataset.fileExtensions.join(", ") }}
                </div>
              </section>
            </div>
          </div>

          <section
            v-if="
              normalizedDataset.source && normalizedDataset.source !== 'Unknown'
            "
            class="mt-8 border-t border-slate-50 pt-4 dark:border-gray-700"
          >
            <div class="mb-1 text-[10px] font-bold tracking-widest uppercase">
              Source Repository
            </div>
            <p class="text-sm font-medium">
              {{ normalizedDataset.source }}
            </p>
          </section>
        </div>

        <div
          class="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-4 dark:border-gray-700 dark:bg-gray-800"
        >
          <div class="flex flex-1 flex-col p-8">
            <div
              class="mb-2 text-[10px] font-bold tracking-widest text-[#00897b] uppercase"
            >
              Selection <span class="font-bold text-red-500">*</span>
            </div>
            <p class="mb-6 text-sm">
              Does this dataset contain eye imaging data like OCT, OCTA,
              FLIO, or retinal imaging?
            </p>
            <div class="mb-8 flex flex-col gap-2.5">
              <button
                @click="confidence = 'yes'"
                :class="[
                  'flex items-center justify-between rounded-xl border px-5 py-4 transition-all',
                  confidence === 'yes'
                    ? 'border-[#00897b] bg-[#e0f2f1] ring-1 ring-[#00897b]'
                    : 'border-slate-200 bg-white hover:border-[#00897b]/50 hover:bg-slate-50'
                ]"
              >
                <span class="text-sm font-bold tracking-wide uppercase text-[#00897b]">Yes</span>
                <UIcon 
                  name="i-heroicons-check-circle-20-solid" 
                  class="w-5 h-5 text-[#00897b]" 
                />
              </button>

              <button
                @click="confidence = 'no'"
                :class="[
                  'flex items-center justify-between rounded-xl border px-5 py-4 transition-all',
                  confidence === 'no'
                    ? 'border-[#c62828] bg-[#ffebee] ring-1 ring-[#c62828]'
                    : 'border-slate-200 bg-white hover:border-[#c62828]/50 hover:bg-slate-50'
                ]"
              >
                <span class="text-sm font-bold tracking-wide uppercase text-[#c62828]">No</span>
                <UIcon 
                  name="i-heroicons-x-circle-20-solid" 
                  class="w-5 h-5 text-[#c62828]" 
                />
              </button>

              <button
                @click="confidence = 'maybe'"
                :class="[
                  'flex items-center justify-between rounded-xl border px-5 py-4 transition-all',
                  confidence === 'maybe'
                    ? 'border-slate-600 bg-slate-100 ring-1 ring-slate-600'
                    : 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50'
                ]"
              >
                <span class="text-sm font-bold tracking-wide uppercase text-slate-500">Unsure</span>
                <UIcon 
                  name="i-heroicons-question-mark-circle-20-solid" 
                  class="w-5 h-5 text-slate-500" 
                />
              </button>
            </div>

            <div class="mt-auto">
              <div
                class="mb-2 text-[10px] font-bold tracking-widest text-[#00897b] uppercase"
              >
                Optional Comments
              </div>
              <UTextarea
                v-model="comment"
                placeholder=""
                :rows="4"
                class="w-full"
              />
            </div>
          </div>

          <div class="mt-auto flex gap-3 p-8 pt-0">
            <button
              v-if="index > 0"
              type="button"
              @click="goBack"
              :disabled="submitting"
              class="flex-1 rounded-lg border border-slate-200 py-4 text-sm font-bold tracking-widest uppercase transition-all hover:bg-slate-50 disabled:opacity-30 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Back
            </button>

            <button
              type="button"
              @click="goNext"
              :disabled="!canSubmit || submitting"
              class="flex-[2] rounded-lg py-4 text-sm font-bold tracking-widest uppercase shadow-sm transition-all disabled:opacity-30"
              :class="
                canSubmit
                  ? 'bg-[#00897b] text-white hover:bg-[#00796b]'
                  : 'cursor-not-allowed bg-slate-100 dark:bg-gray-700'
              "
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
