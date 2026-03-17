<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
});

useSeoMeta({ title: "Survey" });

const route = useRoute();
const toast = useToast();

const { data, error } = await useFetch("/api/dataset");

if (error.value) {
  toast.add({
    title: "Failed to load datasets",
    color: "error",
    icon: "material-symbols:error",
  });
}

const datasets = computed(() => data.value?.datasets ?? []);
const evaluations = computed(() => data.value?.evaluations ?? {});
const total = computed(() => datasets.value.length);

const index = computed(() => {
  const i = Number(route.query.index ?? 0);
  return isNaN(i) ? 0 : Math.max(0, Math.min(i, total.value - 1));
});

const dataset = computed(() => datasets.value[index.value]);
const progress = computed(() =>
  total.value > 0 ? Math.round(((index.value + 1) / total.value) * 100) : 0,
);

const LABELS = [
  {
    value: "eye-imaging",
    label: "Eye Imaging",
    icon: "material-symbols:visibility",
    color: "primary",
  },
  {
    value: "eye-software",
    label: "Eye Software",
    icon: "material-symbols:code",
    color: "secondary",
  },
  {
    value: "eye-other",
    label: "Eye Other",
    icon: "material-symbols:eye-tracking",
    color: "warning",
  },
  {
    value: "non-eye",
    label: "Non-Eye",
    icon: "material-symbols:block",
    color: "neutral",
  },
] as const;

type Label = (typeof LABELS)[number]["value"];

const selectedLabel = ref<Label | null>(null);
const confidence = ref(3);
const comment = ref("");
const submitting = ref(false);

watch(
  [dataset, evaluations],
  () => {
    if (!dataset.value) return;
    const existing = evaluations.value[dataset.value.id];
    if (existing) {
      selectedLabel.value = existing.label as Label;
      confidence.value = existing.confidence;
      comment.value = existing.comment ?? "";
    } else {
      selectedLabel.value = null;
      confidence.value = 3;
      comment.value = "";
    }
  },
  { immediate: true },
);

const canSubmit = computed(() => selectedLabel.value !== null);

const submitAndNavigate = async (nextIndex: number) => {
  if (!dataset.value || selectedLabel.value === null) return;
  submitting.value = true;
  try {
    await $fetch("/api/evaluation", {
      method: "POST",
      body: {
        datasetId: dataset.value.id,
        label: selectedLabel.value,
        confidence: confidence.value,
        comment: comment.value || undefined,
      },
    });
    if (data.value) {
      data.value.evaluations[dataset.value.id] = {
        label: selectedLabel.value,
        confidence: confidence.value,
        comment: comment.value || null,
      } as never;
    }
  } catch {
    toast.add({
      title: "Failed to save answer",
      color: "error",
      icon: "material-symbols:error",
    });
    submitting.value = false;
    return;
  }
  submitting.value = false;

  if (nextIndex >= total.value) {
    await navigateTo("/complete");
  } else {
    await navigateTo({ query: { index: nextIndex } });
  }
};

const goNext = () => submitAndNavigate(index.value + 1);
const goPrev = async () => {
  await navigateTo({ query: { index: index.value - 1 } });
};
</script>

<template>
  <div class="mx-auto flex w-full max-w-screen-xl flex-col gap-6 px-4 py-8">
    <!-- Progress -->
    <div class="flex items-center gap-4">
      <span class="text-muted shrink-0 text-sm">
        Dataset {{ index + 1 }} of {{ total }}
      </span>
      <UProgress :value="progress" class="flex-1" />
      <span class="text-muted shrink-0 text-sm">{{ progress }}%</span>
    </div>

    <!-- Dataset card -->
    <div
      v-if="dataset"
      class="bg-elevated flex flex-col gap-4 rounded-xl border p-6"
    >
      <div>
        <h2 class="text-xl font-bold">{{ dataset.title }}</h2>
        <p class="text-muted mt-1 text-sm">{{ dataset.description }}</p>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div v-if="dataset.keywords?.length">
          <p
            class="text-muted mb-1 text-xs font-semibold tracking-wide uppercase"
          >
            Keywords
          </p>
          <div class="flex flex-wrap gap-1">
            <UBadge
              v-for="kw in dataset.keywords"
              :key="kw"
              variant="soft"
              size="sm"
              >{{ kw }}</UBadge
            >
          </div>
        </div>

        <div v-if="dataset.fileExtensions?.length">
          <p
            class="text-muted mb-1 text-xs font-semibold tracking-wide uppercase"
          >
            File Extensions
          </p>
          <div class="flex flex-wrap gap-1">
            <UBadge
              v-for="ext in dataset.fileExtensions"
              :key="ext"
              variant="outline"
              size="sm"
              >{{ ext }}</UBadge
            >
          </div>
        </div>

        <div v-if="dataset.subjectCategories?.length">
          <p
            class="text-muted mb-1 text-xs font-semibold tracking-wide uppercase"
          >
            Subject Categories
          </p>
          <div class="flex flex-wrap gap-1">
            <UBadge
              v-for="cat in dataset.subjectCategories"
              :key="cat"
              variant="soft"
              color="secondary"
              size="sm"
              >{{ cat }}</UBadge
            >
          </div>
        </div>

        <div v-if="dataset.authorAffiliation">
          <p
            class="text-muted mb-1 text-xs font-semibold tracking-wide uppercase"
          >
            Author Affiliation
          </p>
          <p class="text-sm">{{ dataset.authorAffiliation }}</p>
        </div>
      </div>
    </div>
    <div
      v-else
      class="bg-elevated flex h-40 items-center justify-center rounded-xl border"
    >
      <p class="text-muted text-sm">No dataset available</p>
    </div>

    <!-- Question -->
    <div class="flex flex-col gap-4">
      <p class="text-lg font-semibold">How would you classify this dataset?</p>

      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <UButton
          v-for="opt in LABELS"
          :key="opt.value"
          size="xl"
          :variant="selectedLabel === opt.value ? 'solid' : 'outline'"
          :color="opt.color"
          :icon="opt.icon"
          class="justify-center"
          @click="selectedLabel = opt.value"
        >
          {{ opt.label }}
        </UButton>
      </div>

      <!-- Confidence slider -->
      <Transition name="fade">
        <div v-if="selectedLabel !== null" class="flex flex-col gap-4 pt-2">
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">Confidence</span>
              <span class="text-muted text-sm">{{ confidence }} / 5</span>
            </div>

            <input
              v-model.number="confidence"
              type="range"
              min="1"
              max="5"
              step="1"
            />
            <div class="text-muted flex justify-between text-xs">
              <span>Not confident</span>
              <span>Very confident</span>
            </div>
          </div>

          <div class="text-sm font-medium">Additional comments (optional)</div>

          <UTextarea
            v-model="comment"
            placeholder="Optional comment..."
            :rows="2"
            autoresize
          />
        </div>
      </Transition>
    </div>

    <!-- Navigation -->
    <div class="flex items-center justify-between pt-2">
      <UButton
        variant="ghost"
        icon="material-symbols:arrow-back"
        :disabled="index === 0"
        @click="goPrev"
      >
        Previous
      </UButton>

      <UButton
        :loading="submitting"
        :disabled="!canSubmit"
        trailing-icon="material-symbols:arrow-forward"
        @click="goNext"
      >
        {{ index === total - 1 ? "Finish" : "Next" }}
      </UButton>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
