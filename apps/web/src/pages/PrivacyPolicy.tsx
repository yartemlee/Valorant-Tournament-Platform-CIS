import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
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
            Политика конфиденциальности
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Последнее обновление: {new Date().toLocaleDateString("ru-RU")}
          </p>

          <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">1. Общие положения</h2>
              <p>
                ValoHub (далее — «Платформа») — турнирная платформа по VALORANT для СНГ региона.
                Настоящая Политика конфиденциальности описывает, какие данные мы собираем,
                как используем и защищаем вашу персональную информацию.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">2. Какие данные мы собираем</h2>
              <h3 className="font-medium text-foreground mt-3 mb-2">2.1 Данные при регистрации</h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Адрес электронной почты</li>
                <li>Имя пользователя (юзернейм)</li>
                <li>Имя и фамилия (опционально)</li>
                <li>Дата рождения (для проверки возраста 16+)</li>
              </ul>

              <h3 className="font-medium text-foreground mt-3 mb-2">2.2 Данные через Riot Sign On (RSO)</h3>
              <p className="mb-2">При авторизации через Riot Games мы получаем:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Riot ID (игровое имя и тег)</li>
                <li>PUUID (уникальный идентификатор игрока Riot)</li>
                <li>Текущий ранг в VALORANT (через Riot API)</li>
                <li>Регион аккаунта</li>
              </ul>

              <h3 className="font-medium text-foreground mt-3 mb-2">2.3 Данные, которые мы НЕ собираем</h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Пароль от Riot аккаунта</li>
                <li>Платёжную информацию Riot аккаунта</li>
                <li>Историю покупок в игре</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">3. Как мы используем данные</h2>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Аутентификация и авторизация на платформе</li>
                <li>Формирование профиля игрока</li>
                <li>Подтверждение ранга для участия в турнирах</li>
                <li>Отображение статистики и рейтингов</li>
                <li>Отправка уведомлений о турнирах и активности</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">4. Хранение данных</h2>
              <p>
                Данные хранятся в защищённой базе данных Supabase с включённой
                Row Level Security (RLS). Доступ к данным ограничен на уровне
                базы данных — каждый пользователь видит только свои данные.
                RSO-токены шифруются и обновляются автоматически.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">5. Передача данных третьим лицам</h2>
              <p>
                Мы не передаём и не продаём ваши персональные данные третьим лицам.
                Данные могут быть предоставлены только в случаях, предусмотренных
                действующим законодательством.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">6. Удаление данных</h2>
              <p>
                Вы можете запросить полное удаление вашего аккаунта и всех связанных
                данных. После удаления восстановление невозможно. Для удаления
                обратитесь к администрации платформы.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">7. Riot Games API</h2>
              <p>
                ValoHub использует Riot Games API в соответствии с{" "}
                <a
                  href="https://developer.riotgames.com/policies/general"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Политикой использования Riot Developer API
                </a>
                . Данные из Riot API используются исключительно для функционирования
                платформы и не хранятся дольше необходимого.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">8. Контакты</h2>
              <p>
                По вопросам, связанным с обработкой персональных данных, обращайтесь
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

export default PrivacyPolicy;
