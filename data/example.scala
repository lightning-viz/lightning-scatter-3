import org.viz.lightning._
import scala.util.Random

val lgn = Lightning()

val x = Array.fill(100)(Random.nextFloat() * 15)
val y = Array.fill(100)(Random.nextFloat() * 15)
val z = Array.fill(100)(Random.nextFloat() * 15)
val group = Array.fill(100)(Random.nextInt() * 5)
val size = Array.fill(100)(Random.nextFloat() * 10 + 5)

lgn.scatter3(x, y, z, group=group, size=size)
