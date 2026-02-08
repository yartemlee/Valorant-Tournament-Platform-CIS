import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const TermsOfService = () => {
  return (
    <div className="min-h-screen gradient-mesh p-4 py-12">
      <div className="max-w-3xl mx-auto animate-fade-in-up">
        <div className="glass rounded-2xl p-8 shadow-card border border-border/50">
          {/* Template Banner */}
          <div className="flex items-start gap-3 p-3 mb-6 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-400" />
            <p className="text-sm leading-snug">
              <span className="font-semibold">Шаблон</span> — требует юридической проверки перед production использованием.
            </p>
          </div>

          <h1 className="text-3xl font-display font-bold mb-2 tracking-tight">
            Условия использования
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Последнее обновление: {new Date().toLocaleDateString("ru-RU")}
          </p>

          <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">1. Общие положения</h2>
              <p>
                ValoHub (далее — «Платформа») предоставляет услуги по организации
                и проведению любительских и полупрофессиональных турниров по VALORANT
                в СНГ регионе. Используя Платформу, вы соглашаетесь с настоящими
                Условиями использования.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">2. Регистрация и аккаунт</h2>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Для регистрации необходимо достичь возраста 16 лет</li>
                <li>Один пользователь может иметь только один аккаунт</li>
                <li>Вы несёте ответственность за безопасность своего аккаунта</li>
                <li>Предоставление ложной информации может привести к блокировке</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">3. Правила платформы</h2>
              <h3 className="font-medium text-foreground mt-3 mb-2">3.1 Команды</h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Игрок может состоять только в одной команде одновременно</li>
                <li>Максимальный размер команды — 10 игроков</li>
                <li>Минимальный размер команды — 1 игрок</li>
                <li>Только капитан или тренер могут регистрировать команду на турнир</li>
              </ul>

              <h3 className="font-medium text-foreground mt-3 mb-2">3.2 Турниры</h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Для участия в турнирах необходимо привязать Riot ID</li>
                <li>Запрещено использование смурф-аккаунтов</li>
                <li>Участники обязаны соблюдать расписание матчей</li>
                <li>Неявка на матч может привести к техническому поражению</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">4. Запрещённые действия</h2>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Использование читов, эксплойтов и запрещённого ПО</li>
                <li>Мультиаккаунтинг</li>
                <li>Оскорбления, дискриминация, токсичное поведение</li>
                <li>Подстава матчей (match fixing)</li>
                <li>Попытки обхода системы рангов</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">5. Использование Riot Games API</h2>
              <p>
                Платформа использует Riot Games API для получения игровых данных.
                Используя ValoHub, вы соглашаетесь с тем, что ваши игровые данные
                (Riot ID, ранг, статистика) могут быть получены и отображены на
                платформе в соответствии с{" "}
                <a
                  href="https://developer.riotgames.com/policies/general"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Политикой Riot Developer API
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">6. Ответственность</h2>
              <p>
                Платформа предоставляется «как есть». Мы не несём ответственности
                за перебои в работе сервиса, потерю данных или иные убытки,
                связанные с использованием платформы. Мы оставляем за собой право
                изменять, приостанавливать или прекращать работу платформы в любое время.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">7. Изменение условий</h2>
              <p>
                Мы оставляем за собой право изменять настоящие Условия использования.
                О существенных изменениях пользователи будут уведомлены через платформу.
                Продолжение использования платформы после внесения изменений означает
                согласие с новыми условиями.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">8. Контакты</h2>
              <p>
                По вопросам, связанным с Условиями использования, обращайтесь
                к администрации платформы.
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Вернуться на главную
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
