<template>
  <div>
    <McMarkdownCard
      :enableThink="true"
      :content="mockAnswer"
      :theme="theme"
    ></McMarkdownCard>
  </div>
</template>
<script setup>
import { ref, onMounted } from "vue";
let themeService;
const theme = ref("light");
const messages = ref([]);
const aiModelAvatar = {
  imgSrc: "https://matechat.gitcode.com/logo.svg",
  width: 32,
  height: 32,
};
const isLoading = ref(false);
let interval = null;
const thinkBtnText = ref("已深度思考 (用时16秒)");
const btnIcon = ref("icon-chevron-up-2");
const mockAnswer = `
<think>
嗯，用户让我帮他写一个快速排序。我得先回想一下快速排序的原理。快速排序是分治算法的一种，基本步骤是选一个基准元素，然后把数组分成两部分，一部分比基准小，另一部分比基准大，然后递归地对这两部分排序。

首先，我得确定基准的选择。通常有三种方法：选第一个元素、选中间元素或者随机选。选中间可能比较好，避免最坏情况的时间复杂度。比如数组已经有序的时候，选第一个会导致O(n²)的时间复杂度，但选中间元素可能更平衡。

然后，分区操作怎么做呢？分区的目标是把比基准小的放左边，大的放右边。可以用双指针的方法，左边找比基准大的，右边找比基准小的，然后交换，直到指针相遇。这时候再把基准放到正确的位置，返回基准的索引。

接下来是递归调用。对基准左边的子数组和右边的子数组分别进行快速排序，直到子数组的长度小于等于1，这时候数组就已经有序了。

现在要考虑用户的需求。用户可能对编程不太熟悉，所以代码需要简洁易懂，同时要有注释说明。或者用户可能需要一个高效的实现，不过快速排序的平均时间复杂度已经是O(n log n)了，应该没问题。

可能的边缘情况是数组为空或只有一个元素，这时候直接返回。所以函数里要先处理这种情况。

然后，测试一下这个函数是否正确。比如输入一个无序数组，比如[3,6,8,10,1,2,1]，看看排序后的结果是否是[1,1,2,3,6,8,10]。或者测试已经有序的数组，比如[1,2,3,4,5]，确保不会出现栈溢出或者错误的结果。

还有，是否需要处理重复元素？快速排序本身是能处理重复的，所以应该没问题。

再考虑语言的问题，用户没有说明用什么语言，但根据用户的名字或者上下文，可能想要Python的实现？或者可能其他语言。不过根据常见情况，可能先给出Python版本。

所以，综合这些思考，可以写出一个Python的快速排序函数。基准选中间元素，分区使用双指针，递归处理左右子数组。然后加上注释，解释每一步的作用。

最后，给出示例用法，让用户知道如何调用这个函数，并验证结果是否正确。
</think>
    
以下是使用 Python 实现的快速排序算法，包含详细注释：

\`\`\`python
def quick_sort(arr):
    """实现快速排序的递归函数"""
    # 基线条件：当数组长度小于等于1时，直接返回
    if len(arr) <= 1:
        return arr
    
    # 选择中间元素作为基准值（可有效避免最坏情况）
    pivot = arr[len(arr) // 2]
    
    # 将数组分成三部分：小于基准、等于基准、大于基准
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    
    # 递归排序左右子数组，合并结果
    return quick_sort(left) + middle + quick_sort(right)

# 示例用法
if __name__ == "__main__":
    example_arr = [3,6,8,10,1,2,1]
    sorted_arr = quick_sort(example_arr)
    print("原数组：", example_arr)
    print("排序后：", sorted_arr)
\`\`\`
`;
const changeTheme = () => {
  theme.value = theme.value === "light" ? "dark" : "light";
  themeClass.value =
    themeClass.value === "light-background"
      ? "dark-background"
      : "light-background";
};

const themeChange = () => {
  if (themeService) {
    theme.value =
      themeService.currentTheme.id === "infinity-theme" ? "light" : "dark";
  }
};

const toggleThink = (idx) => {
  if (isLoading.value) {
    return;
  }
  const targetNode = document.querySelectorAll(".mc-bubble-content-container")[
    idx
  ];
  if (targetNode) {
    const thinkBlock = targetNode.querySelector(".mc-think-block");
    if (thinkBlock) {
      const currentDisplay = getComputedStyle(thinkBlock).display;
      thinkBlock.style.display = currentDisplay === "none" ? "block" : "none";
      btnIcon.value =
        currentDisplay === "none" ? "icon-chevron-up-2" : "icon-chevron-down-2";
    }
  }
};

const generateAnswer = () => {
  if (isLoading.value) {
    isLoading.value = false;
    clearInterval(interval);
  } else {
    isLoading.value = true;
    messages.value = [
      {
        from: "ai-model",
        avatarConfig: { ...aiModelAvatar },
        content: "",
        loading: false,
      },
    ];
    thinkBtnText.value = "思考中...";
    let currentIndex = 0;
    let totalTime = 0;
    interval = setInterval(() => {
      if (currentIndex < mockAnswer.length) {
        messages.value[messages.value.length - 1].content = mockAnswer.slice(
          0,
          currentIndex
        );
        currentIndex += 10;
        totalTime += 100;
        if (
          messages.value[messages.value.length - 1].content.indexOf(
            "</think>"
          ) > -1 &&
          thinkBtnText.value === "思考中..."
        ) {
          thinkBtnText.value = `已深度思考 (用时${totalTime / 1000}秒)`;
        }
      } else {
        isLoading.value = false;
        clearInterval(interval);
        messages.value[messages.value.length - 1].loading = false;
      }
    }, 100);
  }
};

onMounted(() => {
  if (typeof window !== "undefined") {
    themeService = window["devuiThemeService"];
  }
  themeChange();
  if (themeService && themeService.eventBus) {
    themeService.eventBus.add("themeChanged", themeChange);
  }

  messages.value.push({
    from: "ai-model",
    avatarConfig: { ...aiModelAvatar },
    content: mockAnswer,
  });
});
</script>

<style lang="scss" scoped>
.btn-container {
  display: flex;
  justify-content: end;
  margin-bottom: 12px;
}
</style>

<style lang="scss">
@import "devui-theme/styles-var/devui-var.scss";
.think-toggle-btn {
  display: flex;
  gap: 8px;
  align-items: center;
  border-radius: 10px;
  padding: 7px 10px;
  margin-bottom: 12px;
  width: fit-content;
  cursor: pointer;
  background-color: $devui-area;
  &:hover {
    background-color: var(--devui-btn-common-bg-hover);
  }
}
</style>
