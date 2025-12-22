/**
 * 未配置时的引导页面
 */

interface OnboardingViewProps {
  onOpenOptions: () => void;
}

export function OnboardingView({ onOpenOptions }: OnboardingViewProps) {
  return (
    <div className="relative h-[80vh] min-h-[580px] w-[380px] overflow-hidden rounded-2xl bg-[var(--tab-popup-onboarding-bg)] text-[var(--tab-popup-primary-text)] shadow-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tab-popup-onboarding-radial-top),transparent_70%)] opacity-80" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_var(--tab-popup-onboarding-radial-bottom),transparent_65%)] opacity-80" />
      <div className="absolute inset-0 bg-[color:var(--tab-popup-onboarding-overlay)] backdrop-blur-2xl" />
      <div className="relative flex h-full flex-col">
        <header className="px-6 pt-8 pb-6">
          <div className="rounded-3xl border border-[color:var(--tab-popup-onboarding-card-border)] bg-[color:var(--tab-popup-onboarding-card-bg)] p-5 shadow-xl shadow-[color:var(--tab-popup-onboarding-shadow)] backdrop-blur-xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--tab-popup-primary-from)] to-[var(--tab-popup-primary-via)] shadow-lg shadow-[color:var(--tab-popup-primary-shadow-strong)]">
                <svg className="h-6 w-6 text-[var(--tab-popup-primary-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--tab-popup-onboarding-label)]">Onboarding</p>
                <h1 className="text-2xl font-semibold text-[var(--tab-popup-primary-text)]">欢迎使用 AI 书签助手</h1>
                <p className="text-sm text-[color:var(--tab-popup-onboarding-desc)]">完成基础配置，即可为任意网页生成智能标签与分类建议。</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-5 overflow-y-auto px-6 pb-6">
          <section className="rounded-3xl border border-[color:var(--tab-popup-onboarding-card-border)] bg-[color:var(--tab-popup-onboarding-subtle-bg)] p-5 shadow-inner shadow-[color:var(--tab-popup-onboarding-shadow)] backdrop-blur-xl">
            <h2 className="text-sm font-semibold text-[var(--tab-popup-primary-text)]">必备信息</h2>
            <p className="mt-1 text-xs text-[color:var(--tab-popup-onboarding-label)]">准备以下三项配置，助手即可立即开始工作：</p>
            <ol className="mt-4 space-y-3 text-xs text-[color:var(--tab-popup-onboarding-desc)]">
              <li className="flex gap-3 rounded-2xl border border-[color:var(--tab-popup-onboarding-subtle-border)] bg-[color:var(--tab-popup-onboarding-subtle-bg)] p-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-xl bg-[color:var(--tab-popup-onboarding-tip-bg)] text-[11px] font-semibold text-[var(--tab-popup-onboarding-tip-text)]">1</span>
                <div>
                  <p className="font-semibold text-[var(--tab-popup-primary-text)]">AI 服务 API Key</p>
                  <p className="mt-1 text-[11px] text-[color:var(--tab-popup-onboarding-label)]">用于生成智能标签的模型凭证，支持多个主流服务商。</p>
                </div>
              </li>
              <li className="flex gap-3 rounded-2xl border border-[color:var(--tab-popup-onboarding-subtle-border)] bg-[color:var(--tab-popup-onboarding-subtle-bg)] p-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-xl bg-[color:var(--tab-popup-onboarding-tip-bg)] text-[11px] font-semibold text-[var(--tab-popup-onboarding-tip-text)]">2</span>
                <div>
                  <p className="font-semibold text-[var(--tab-popup-primary-text)]">书签站点 API 地址</p>
                  <p className="mt-1 text-[11px] text-[color:var(--tab-popup-onboarding-label)]">指向你的书签服务端点，默认为 TMarks 官方地址。</p>
                </div>
              </li>
              <li className="flex gap-3 rounded-2xl border border-[color:var(--tab-popup-onboarding-subtle-border)] bg-[color:var(--tab-popup-onboarding-subtle-bg)] p-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-xl bg-[color:var(--tab-popup-onboarding-tip-bg)] text-[11px] font-semibold text-[var(--tab-popup-onboarding-tip-text)]">3</span>
                <div>
                  <p className="font-semibold text-[var(--tab-popup-primary-text)]">书签站点 API Key</p>
                  <p className="mt-1 text-[11px] text-[color:var(--tab-popup-onboarding-label)]">用于同步与保存书签数据，请在服务端控制台生成密钥。</p>
                </div>
              </li>
            </ol>
          </section>

          <section className="rounded-3xl border border-[color:var(--tab-popup-onboarding-card-border)] bg-gradient-to-br from-[color:var(--tab-popup-onboarding-tip-bg)] via-[color:var(--tab-popup-onboarding-tip-bg)] to-[color:var(--tab-popup-onboarding-tip-bg)] p-5 shadow-lg shadow-[color:var(--tab-popup-onboarding-shadow)] backdrop-blur-xl">
            <h2 className="text-sm font-semibold text-[var(--tab-popup-primary-text)]">小贴士</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[11px] text-[color:var(--tab-popup-onboarding-desc)]">
              <li>可在设置页保存多个 API 与模型组合，一键切换场景。</li>
              <li>支持自定义 Prompt，满足不同标签风格或语言需求。</li>
              <li>配置完成后，助手会自动抓取当前标签页并生成推荐。</li>
            </ul>
          </section>
        </main>

        <footer className="px-6 pb-6">
          <button
            onClick={onOpenOptions}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--tab-popup-primary-from)] via-[var(--tab-popup-primary-via)] to-[var(--tab-popup-primary-to)] px-6 py-3 text-sm font-semibold text-[var(--tab-popup-primary-text)] shadow-lg shadow-[color:var(--tab-popup-primary-shadow)] transition-all duration-200 hover:shadow-xl hover:shadow-[color:var(--tab-popup-primary-shadow-strong)] active:scale-95"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            前往设置
          </button>
        </footer>
      </div>
    </div>
  );
}
