import org.viz.lightning._
import scala.util.Random

val lgn = Lightning()

val x = Array.fill(100)(Random.nextFloat() * 15)
val y = Array.fill(100)(Random.nextFloat() * 15)
val z = Array.fill(100)(Random.nextFloat() * 15)

lgn.scatter3(x, y, z)
