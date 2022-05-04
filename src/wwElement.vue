<template>
  <div class="ww-lightbox" :style="cssVariables">
    <div class="ww-lightbox__trigger" @click="handlerExplorer">
      <wwLayout :path="`triggerContainer`">
        <template #default="{ item }">
          <wwLayoutItem>
            <wwElement v-bind="item" />
          </wwLayoutItem>
        </template>
      </wwLayout>
    </div>
    <div class="ww-lightbox__content" v-show="isExplorerVisible && isEditing">
      <div class="content-container">
        <div v-for="(el, index) in content.mediaElements" :key="index">
          <div v-show="index === contentIndex">
            <wwElement
              data-lightbox-media
              :data-lightbox-group="content.group"
              :data-lightbox-linked="content.linked"
              :data-lightbox-id="id"
              v-bind="el"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="ww-lightbox__explorer" v-show="isExplorerVisible">
      <div class="close-button" @click="handlerExplorer">
        <wwElement v-bind="content.closeIcon" />
      </div>
      <div class="ww-lightbox__explorer-content">
        <Transition :name="activeTransition" mode="out-in">
          <div
            class="content-container"
            v-if="explorerHTML"
            v-html="explorerHTML"
            :key="`item-${lightboxIndex}`"
          />
        </Transition>
      </div>
    </div>
    <div v-show="showPrev" class="explorer-nav -prev" @click="explorerPrev">
      <wwElement v-bind="content.explorerArrows[0]" />
    </div>
    <div v-show="showNext" class="explorer-nav -next" @click="explorerNext">
      <wwElement v-bind="content.explorerArrows[1]" />
    </div>
    <div
      class="ww-lightbox__summary"
      ref="lightboxSummary"
      v-if="!isEditing && isExplorerVisible"
    >
      <div
        class="summary-item"
        v-for="(miniature, index) in groupMiniatures"
        :key="index"
        @click="changeIndex(index)"
      >
        <wwElement
          v-bind="content.miniatureElement"
          :wwProps="{ url: miniature.url }"
        />
      </div>
    </div>
    <div
      class="ww-lightbox__summary"
      v-else-if="isEditing && isExplorerVisible"
    >
      <div class="summary-item">
        <wwElement
          v-if="
            groupMiniatures[contentIndex] && groupMiniatures[contentIndex].url
          "
          v-bind="content.miniatureElement"
          :wwProps="{ url: groupMiniatures[contentIndex].url }"
        />
      </div>
    </div>
  </div>
</template>

<script>
import useMiniatures from "./useMiniatures";

// TODO On selected

export default {
  props: {
    content: { type: Object, required: true },
    wwFrontState: { type: Object, required: true },
    /* wwEditor:start */
    wwEditorState: { type: Object, required: true },
    /* wwEditor:end */
  },
  setup(props) {
    const { id, groupMiniatures, linked } = useMiniatures(props);

    return { id, groupMiniatures, linked };
  },
  data() {
    return {
      isExplorerVisible: false,
      lightboxIndex: 0,
      contentIndex: 0,
      explorerContent: [],
      activeTransition: "fadeLeft",
      isDown: false,
      startX: null,
      scrollLeft: null,
    };
  },
  watch: {
    isEditing(val) {
      if (val === false) this.isExplorerVisible = false;

      this.contentIndex = 0;
      this.lightboxIndex = 0;

      this.$emit("update:sidepanel-content", {
        path: "edit",
        value: false,
      });
    },
    "content.medias": {
      deep: true,
      async handler(newMedias, oldMedias) {
        if (newMedias && oldMedias && newMedias.length !== oldMedias.length)
          return;

        newMedias.forEach(async (media, index) => {
          if (media && oldMedias[index]) {
            if (media.media !== oldMedias[index].media) {
              const mediaElements = this.content.mediaElements;
              const elem = await wwLib.createElement(
                media.media,
                {},
                {
                  name:
                    media.media === "ww-image"
                      ? "Media - Image"
                      : "Media - Video",
                },
                this.wwFrontState.sectionId
              );
              mediaElements[index] = elem;
              this.$emit("update:content", { mediaElements });
            }
          }
        });
      },
    },
    "content.linked"() {
      this.$emit("update:content", { group: "" });
    },
    "wwEditorState.sidepanelContent.edit"(val) {
      if (val) this.handleLightboxes();
      else this.destroyExplorer();

      this.$nextTick(() => {
        this.isExplorerVisible = val;
      });
    },
    "wwEditorState.sidepanelContent.mediaIndex"(index) {
      this.isExplorerVisible = true;
      this.contentIndex = index;
    },
    isExplorerVisible(val) {
      this.$nextTick(() => {
        const summary = this.$refs.lightboxSummary;
        if (!summary) return;

        if (!this.isEditing && val) {
          summary.addEventListener("mousedown", this.onMouseDown);
          summary.addEventListener("mouseleave", this.onMouseLeave);
          summary.addEventListener("mouseup", this.onMouseUp);
          summary.addEventListener("mousemove", this.onMouseMove);
        } else if (!val) {
          summary.removeEventListener("mousedown", this.onMouseDown);
          summary.removeEventListener("mouseleave", this.onMouseLeave);
          summary.removeEventListener("mouseup", this.onMouseUp);
          summary.removeEventListener("mousemove", this.onMouseMove);
        }
      });
    },
  },
  computed: {
    isEditing() {
      /* wwEditor:start */
      return (
        this.wwEditorState.editMode === wwLib.wwEditorHelper.EDIT_MODES.EDITION
      );
      /* wwEditor:end */
      // eslint-disable-next-line no-unreachable
      return false;
    },
    showPrev() {
      return (
        !!this.explorerContent[this.lightboxIndex - 1] && this.isExplorerVisible
      );
    },
    showNext() {
      return (
        !!this.explorerContent[this.lightboxIndex + 1] && this.isExplorerVisible
      );
    },
    cssVariables() {
      return {
        "--backdrop-color": this.content.backdropColor,
      };
    },
    explorerHTML() {
      return this.explorerContent[this.lightboxIndex] &&
        this.explorerContent[this.lightboxIndex].outerHTML
        ? this.explorerContent[this.lightboxIndex].outerHTML
        : null;
    },
  },
  methods: {
    async handlerExplorer() {
      if (!this.isExplorerVisible) this.handleLightboxes();
      else this.destroyExplorer();

      this.$nextTick(() => {
        this.isExplorerVisible = !this.isExplorerVisible;
      });
    },
    handleLightboxes() {
      let lightboxes;

      if (this.linked) {
        lightboxes = wwLib
          .getFrontDocument()
          .querySelectorAll("[data-lightbox-media]");
      } else {
        const nodeList = wwLib
          .getFrontDocument()
          .querySelectorAll("[data-lightbox-media]");

        lightboxes = Array.from(nodeList).filter(
          (el) => el.getAttribute("data-lightbox-id") === this.id
        );
      }

      const list = Array.from(lightboxes);
      const indexInList = Array.prototype.indexOf.call(
        lightboxes,
        list.find((el) => el.getAttribute("data-lightbox-id") === this.id)
      );

      this.lightboxIndex = indexInList;

      this.destroyExplorer();

      for (let node of lightboxes) {
        const group = node.getAttribute("data-lightbox-group");
        const id = node.getAttribute("data-lightbox-id");

        if (!group.length && this.id !== id) return;

        const clone = node.cloneNode(true);
        clone.removeAttribute("data-lightbox-media");
        this.explorerContent.push(clone);
      }
    },
    destroyExplorer() {
      this.explorerContent = [];
    },
    onMediaRemove(index) {
      const mediaElements = [...this.content.mediaElements];
      mediaElements.splice(index, 1);

      this.$emit("update:content", { mediaElements });
    },
    async onMediaAdded() {
      const mediaElements = [...this.content.mediaElements];
      if (mediaElements.length === 0) {
        const elem = await wwLib.createElement(
          "ww-image",
          {},
          { name: "Media - Image" },
          this.wwFrontState.sectionId
        );
        mediaElements.push(elem);
      } else {
        console.log(mediaElements[mediaElements.length - 1]);
        const elem = await wwLib.wwObjectHelper.cloneElement(
          mediaElements[mediaElements.length - 1].uid,
          this.wwFrontState.sectionId
        );
        mediaElements.push(elem);
      }
      this.$emit("update:content", { mediaElements });
    },
    changeIndex(index) {
      this.activeTransition =
        index > this.lightboxIndex ? "fadeLeft" : "fadeRight";
      this.lightboxIndex = index;
    },
    explorerPrev() {
      if (!!this.explorerContent[this.lightboxIndex - 1]) {
        this.changeIndex(this.lightboxIndex - 1);
      }
    },
    explorerNext() {
      if (!!this.explorerContent[this.lightboxIndex + 1]) {
        this.changeIndex(this.lightboxIndex + 1);
      }
    },
    onMouseDown(event) {
      const summary = this.$refs.lightboxSummary;
      if (!summary) return;

      this.isDown = true;
      summary.classList.add("active");
      this.startX = event.pageX - summary.offsetLeft;
      this.scrollLeft = summary.scrollLeft;
    },
    onMouseLeave(event) {
      const summary = this.$refs.lightboxSummary;
      if (!summary) return;

      this.isDown = false;
      summary.classList.remove("active");
    },
    onMouseUp(event) {
      const summary = this.$refs.lightboxSummary;
      if (!summary) return;

      this.isDown = false;
      summary.classList.remove("active");
    },
    onMouseMove(event) {
      if (!this.isDown) return;
      const summary = this.$refs.lightboxSummary;
      if (!summary) return;

      event.preventDefault();
      const x = event.pageX - summary.offsetLeft;
      const walk = (x - this.startX) * 2;
      summary.scrollLeft = this.scrollLeft - walk;
    },
  },
  beforeUnmount() {
    const summary = this.$refs.lightboxSummary;
    if (!summary) return;

    summary.removeEventListener("mousedown", this.onMouseDown);
    summary.removeEventListener("mouseleave", this.onMouseLeave);
    summary.removeEventListener("mouseup", this.onMouseUp);
    summary.removeEventListener("mousemove", this.onMouseMove);
  },
  mounted() {
    this.handleLightboxes();
  },
};
</script>

<style lang="scss" scoped>
.ww-lightbox {
  position: inherit;

  &__explorer {
    z-index: 3;
    display: flex;
    direction: columns;
    justify-content: center;
    align-items: center;

    .close-button {
      position: absolute;
      top: 20px;
      right: 20px;

      // To update
      z-index: 10000;
    }

    position: fixed;
    top: 0px;
    right: 0px;
    bottom: 0px;
    left: 0px;

    background-color: var(--backdrop-color);

    &-content {
      width: 100%;
    }
  }

  &__content {
    z-index: 3;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: stretch;
    position: fixed;
    top: 0px;
    right: 0px;
    bottom: 0px;
    left: 0px;

    background-color: var(--backdrop-color);
  }

  .explorer-nav {
    position: fixed;
    top: 50%;
    transform: translateY(-50%);

    // To update
    z-index: 10000;

    &.-prev {
      left: 0px;
    }

    &.-next {
      right: 0px;
    }
  }

  &__summary {
    width: 90%;
    overflow-x: auto;

    z-index: 100;
    position: fixed;
    bottom: 0px;
    left: 50%;
    transform: translateX(-50%);

    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;

    &.active {
      cursor: grabbing;
    }

    &::-webkit-scrollbar {
      display: none;
    }
  }
}

// FADE LEFT
.fadeLeft-enter-active,
.fadeLeft-leave-active {
  transition: all 0.4s;
}
.fadeLeft-enter-from,
.fadeLeft-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}
// FADE RIGHT
.fadeRight-enter-active,
.fadeRight-leave-active {
  transition: all 0.4s;
}

.fadeRight-enter-from,
.fadeRight-leave-to {
  opacity: 0;
  transform: translateX(8px);
}
</style>
