import { reactive, watch, computed, onUnmounted } from "vue";

const GROUPS_MINIATURES = reactive({});

export default function useMiniatures(props) {
  const id = `ww-lightbox-${wwLib.wwUtils.getUniqueId()}`;
  const group = computed(() => props.content.group);
  const linked = computed(() => props.content.linked);
  const miniatures = computed(() => {
    return props.content.medias
      .filter((item) => item && "miniature" in item)
      .map((item) => ({
        lightboxId: id,
        url: item.miniature,
      }));
  });
  const groupMiniatures = computed(() => {
    return group.value
      ? Object.values(GROUPS_MINIATURES[group.value]).flat()
      : miniatures.value;
  });

  watch(
    group,
    (newGroup, oldGroup) => {
      if (
        !!oldGroup &&
        GROUPS_MINIATURES[oldGroup] &&
        id in GROUPS_MINIATURES[oldGroup]
      ) {
        delete GROUPS_MINIATURES[oldGroup][id];
      }
      if (newGroup) {
        GROUPS_MINIATURES[newGroup] = GROUPS_MINIATURES[newGroup] || {};
        GROUPS_MINIATURES[newGroup][id] = miniatures;
      }
    },
    { immediate: true }
  );

  onUnmounted(() => {
    if (
      !!group.value &&
      GROUPS_MINIATURES[group.value] &&
      GROUPS_MINIATURES[group.value].hasOwnProperty(id)
    ) {
      delete GROUPS_MINIATURES[group.value][id];
    }
  });

  return { id, groupMiniatures, linked };
}
