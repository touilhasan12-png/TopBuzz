from manim import *

class StraitMap(Scene):
    def construct(self):
        self.camera.background_color = "#13242f"
        title = Text("A STRAIT BETWEEN CONTINENTS", font_size=28, color="#e9c77e", weight=BOLD)
        title.to_edge(UP, buff=0.55)
        europe = Polygon(
            [-5.9, 1.7, 0], [-0.65, 1.55, 0], [-0.45, -1.4, 0], [-5.9, -1.9, 0],
            color="#506954", fill_opacity=0.95, stroke_width=2
        )
        asia = Polygon(
            [0.65, 1.55, 0], [5.9, 1.85, 0], [5.9, -1.7, 0], [0.48, -1.35, 0],
            color="#687454", fill_opacity=0.95, stroke_width=2
        )
        strait = VMobject(color="#43a6b6", stroke_width=18)
        strait.set_points_smoothly([[-0.35,1.65,0],[0.1,.95,0],[-.1,.3,0],[.35,-.4,0],[.05,-1.6,0]])
        golden_horn = VMobject(color="#55b4bf", stroke_width=10)
        golden_horn.set_points_smoothly([[-.15,.3,0],[-1.25,.15,0],[-2.1,-.05,0]])
        city = Dot([-.45,.15,0],radius=.11,color="#f2d48b")
        city_label = Text("HISTORIC CITY",font_size=21,color="#fff2d4").next_to(city,LEFT,buff=.2)
        europe_label = Text("EUROPE",font_size=30,color="#eef0e4").move_to([-3.1,.2,0])
        asia_label = Text("ASIA",font_size=30,color="#eef0e4").move_to([3.2,.2,0])
        water_label = Text("BOSPORUS",font_size=20,color="#c4eef2").rotate(PI/2).move_to([.35,-.05,0])
        note = Text("Black Sea  ↕  Sea of Marmara",font_size=19,color="#d7e4e4").to_edge(DOWN,buff=.55)
        self.play(FadeIn(title),run_time=.8)
        self.play(FadeIn(europe),FadeIn(asia),run_time=1.2)
        self.play(Create(strait),Create(golden_horn),run_time=1.5)
        self.play(FadeIn(europe_label),FadeIn(asia_label),FadeIn(city),FadeIn(city_label),FadeIn(water_label),run_time=1.0)
        self.play(FadeIn(note),run_time=.7)
        self.wait(9.8)
